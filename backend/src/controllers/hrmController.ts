import { Request, Response } from 'express';
import { Employee } from '../models/Employee';
import { Department } from '../models/Department';
import { LeaveRequest } from '../models/LeaveRequest';
import { Attendance } from '../models/Attendance';
import { User } from '../models/User';
import { Token } from '../models/Token';
import { generateInviteToken } from '../utils/jwt';
import { emailService } from '../utils/email';
import { logger } from '../utils/logger';
import { z } from 'zod';
import dayjs from 'dayjs';

// Validation schemas
const createEmployeeSchema = z.object({
  employeeId: z.string().min(1).max(20),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  hireDate: z.string().datetime(),
  salary: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  manager: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string()
  }).optional()
});

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  manager: z.string().optional(),
  budget: z.number().min(0).optional()
});

const createLeaveRequestSchema = z.object({
  employee: z.string(),
  type: z.enum(['vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().max(500).optional(),
  isEmergency: z.boolean().optional()
});

const clockInOutSchema = z.object({
  employee: z.string(),
  action: z.enum(['clock-in', 'clock-out', 'break-start', 'break-end']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string()
  }).optional()
});

const attendanceSchema = z.object({
  employee: z.string(),
  date: z.string().datetime(),
  clockIn: z.string().datetime().optional(),
  clockOut: z.string().datetime().optional(),
  breakStart: z.string().datetime().optional(),
  breakEnd: z.string().datetime().optional(),
  status: z.enum(['present', 'absent', 'late', 'half-day', 'on-leave']).optional(),
  notes: z.string().max(500).optional()
});

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, department, status, search } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(filter)
      .populate('manager', 'firstName lastName position')
      .populate('userId', 'email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Employee.countDocuments(filter);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const inviter = (req as any).user;

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Find or create department
    let department = await Department.findOne({ 
      name: validatedData.department, 
      companyId 
    });

    if (!department) {
      // Create new department
      department = new Department({
        name: validatedData.department,
        companyId,
        employeeCount: 0,
        isActive: true
      });
      await department.save();
      logger.info(`New department created: ${validatedData.department} for company ${companyId}`);
    }

    // Generate invite token
    const inviteToken = generateInviteToken();
    const invite = new Token({
      token: inviteToken,
      type: 'invite',
      email: validatedData.email,
      role: 'employee', // Default role for employees
      company: companyId,
      expiresAt: dayjs().add(7, 'days').toDate(),
      metadata: {
        employeeData: {
          employeeId: validatedData.employeeId,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          department: validatedData.department,
          position: validatedData.position,
          hireDate: validatedData.hireDate,
          salary: validatedData.salary,
          manager: validatedData.manager,
          address: validatedData.address,
          emergencyContact: validatedData.emergencyContact
        }
      }
    });
    await invite.save();

    // Send invite email
    const inviteLink = `${process.env.FRONTEND_URL}/auth/accept-invite?token=${inviteToken}`;
    try {
      await emailService.sendInviteEmail(validatedData.email, {
        inviteeName: `${validatedData.firstName} ${validatedData.lastName}`,
        inviterName: inviter.getFullName(),
        companyName: (inviter.company as any).name,
        role: 'employee',
        position: validatedData.position,
        department: validatedData.department,
        inviteLink
      });

      logger.info(`Employee invitation sent: ${validatedData.email} to ${validatedData.department} by ${inviter.email}`);

      res.status(201).json({
        success: true,
        message: 'Employee invitation sent successfully. They will become active once they accept the invitation.',
        data: {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          department: validatedData.department,
          position: validatedData.position,
          status: 'invited',
          expiresAt: invite.expiresAt
        }
      });
    } catch (emailError) {
      logger.error(`Failed to send invitation email to ${validatedData.email}:`, emailError);
      
      // Clean up the token if email failed
      await Token.findByIdAndDelete(invite._id);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation email. Please try again.',
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating employee invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const employee = await Employee.findOne({ _id: id, companyId })
      .populate('manager', 'firstName lastName position')
      .populate('userId', 'email role');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createEmployeeSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const updateData = {
      ...validatedData,
      ...(validatedData.hireDate && { hireDate: new Date(validatedData.hireDate) })
    };

    const employee = await Employee.findOneAndUpdate(
      { _id: id, companyId },
      updateData,
      { new: true }
    ).populate('manager', 'firstName lastName position');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const employee = await Employee.findOneAndDelete({ _id: id, companyId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    const departments = await Employee.aggregate([
      { $match: { companyId, status: 'active' } },
      {
        $group: {
          _id: '$department',
          employeeCount: { $sum: 1 },
          avgSalary: { $avg: '$salary' }
        }
      },
      { $sort: { employeeCount: -1 } }
    ]);

    res.json({
      success: true,
      data: { departments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getHrmDashboard = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    // Employee statistics
    const totalEmployees = await Employee.countDocuments({ companyId });
    const activeEmployees = await Employee.countDocuments({ companyId, status: 'active' });
    const inactiveEmployees = await Employee.countDocuments({ companyId, status: 'inactive' });
    const terminatedEmployees = await Employee.countDocuments({ companyId, status: 'terminated' });

    // Department distribution
    const departmentDistribution = await Employee.aggregate([
      { $match: { companyId, status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // New hires (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newHires = await Employee.countDocuments({
      companyId,
      hireDate: { $gte: thirtyDaysAgo }
    });

    // Average salary by department
    const salaryByDepartment = await Employee.aggregate([
      { $match: { companyId, status: 'active', salary: { $exists: true } } },
      {
        $group: {
          _id: '$department',
          avgSalary: { $avg: '$salary' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgSalary: -1 } }
    ]);

    // Leave requests statistics
    const pendingLeaveRequests = await LeaveRequest.countDocuments({ 
      companyId, 
      status: 'pending' 
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.aggregate([
      { 
        $match: { 
          companyId, 
          date: { $gte: today, $lt: tomorrow } 
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          terminatedEmployees,
          newHires,
          pendingLeaveRequests
        },
        charts: {
          departmentDistribution,
          salaryByDepartment,
          todayAttendance
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching HRM dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// DEPARTMENT CONTROLLERS
// =============================================================================

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);
    const companyId = (req as any).user.company;

    // Check if department already exists
    const existingDept = await Department.findOne({ 
      name: validatedData.name, 
      companyId 
    });
    
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    const department = new Department({
      ...validatedData,
      companyId
    });

    await department.save();
    await department.populate('manager', 'firstName lastName position');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { department }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(filter)
      .populate('manager', 'firstName lastName position')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Department.countDocuments(filter);

    res.json({
      success: true,
      data: {
        departments,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const department = await Department.findOne({ _id: id, companyId })
      .populate('manager', 'firstName lastName position');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get employees in this department
    const employees = await Employee.find({ 
      companyId, 
      department: department.name,
      status: 'active'
    }).select('firstName lastName position email');

    res.json({
      success: true,
      data: { 
        department,
        employees 
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createDepartmentSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const department = await Department.findOneAndUpdate(
      { _id: id, companyId },
      validatedData,
      { new: true }
    ).populate('manager', 'firstName lastName position');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: { department }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    // Check if department has employees
    const department = await Department.findOne({ _id: id, companyId });
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const employeesInDept = await Employee.countDocuments({ 
      companyId, 
      department: department.name,
      status: 'active'
    });

    if (employeesInDept > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active employees'
      });
    }

    await Department.findOneAndDelete({ _id: id, companyId });

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// LEAVE REQUEST CONTROLLERS
// =============================================================================

export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const validatedData = createLeaveRequestSchema.parse(req.body);
    const companyId = (req as any).user.company;

    // Calculate days between start and end date
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = new LeaveRequest({
      ...validatedData,
      companyId,
      startDate,
      endDate,
      days
    });

    await leaveRequest.save();
    await leaveRequest.populate('employee', 'firstName lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: { leaveRequest }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getLeaveRequests = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, type, employee } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (employee) filter.employee = employee;

    const leaveRequests = await LeaveRequest.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await LeaveRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        leaveRequests,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateLeaveRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const companyId = (req as any).user.company;
    const approverId = (req as any).user._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const updateData: any = {
      status,
      approvedBy: approverId,
      approvedDate: new Date()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const leaveRequest = await LeaveRequest.findOneAndUpdate(
      { _id: id, companyId, status: 'pending' },
      updateData,
      { new: true }
    )
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or already processed'
      });
    }

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: { leaveRequest }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const leaveRequest = await LeaveRequest.findOne({ _id: id, companyId })
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.json({
      success: true,
      data: { leaveRequest }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// ATTENDANCE CONTROLLERS
// =============================================================================

export const clockInOut = async (req: Request, res: Response) => {
  try {
    const validatedData = clockInOutSchema.parse(req.body);
    const companyId = (req as any).user.company;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: validatedData.employee,
      companyId,
      date: today
    });

    if (!attendance) {
      attendance = new Attendance({
        employee: validatedData.employee,
        companyId,
        date: today
      });
    }

    const now = new Date();

    switch (validatedData.action) {
      case 'clock-in':
        attendance.clockIn = now;
        attendance.status = 'present';
        if (validatedData.location) {
          attendance.location = validatedData.location;
        }
        break;
      case 'clock-out':
        attendance.clockOut = now;
        break;
      case 'break-start':
        attendance.breakStart = now;
        break;
      case 'break-end':
        attendance.breakEnd = now;
        break;
    }

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.json({
      success: true,
      message: `${validatedData.action} recorded successfully`,
      data: { attendance }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error recording attendance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, employee, date, status } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: targetDate, $lt: nextDay };
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1, createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createAttendance = async (req: Request, res: Response) => {
  try {
    const validatedData = attendanceSchema.parse(req.body);
    const companyId = (req as any).user.company;

    const attendanceData = {
      ...validatedData,
      companyId,
      date: new Date(validatedData.date),
      ...(validatedData.clockIn && { clockIn: new Date(validatedData.clockIn) }),
      ...(validatedData.clockOut && { clockOut: new Date(validatedData.clockOut) }),
      ...(validatedData.breakStart && { breakStart: new Date(validatedData.breakStart) }),
      ...(validatedData.breakEnd && { breakEnd: new Date(validatedData.breakEnd) })
    };

    const attendance = new Attendance(attendanceData);
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: { attendance }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating attendance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = attendanceSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const updateData = {
      ...validatedData,
      ...(validatedData.date && { date: new Date(validatedData.date) }),
      ...(validatedData.clockIn && { clockIn: new Date(validatedData.clockIn) }),
      ...(validatedData.clockOut && { clockOut: new Date(validatedData.clockOut) }),
      ...(validatedData.breakStart && { breakStart: new Date(validatedData.breakStart) }),
      ...(validatedData.breakEnd && { breakEnd: new Date(validatedData.breakEnd) })
    };

    const attendance = await Attendance.findOneAndUpdate(
      { _id: id, companyId },
      updateData,
      { new: true }
    ).populate('employee', 'firstName lastName employeeId');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: { attendance }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating attendance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, employee, department } = req.query;
    const companyId = (req as any).user.company;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const matchStage: any = {
      companyId,
      date: { $gte: start, $lte: end }
    };

    if (employee) {
      matchStage.employee = employee;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' }
    ];

    if (department) {
      pipeline.push({
        $match: { 'employeeData.department': department }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$employee',
          employeeData: { $first: '$employeeData' },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
            }
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
            }
          },
          totalHours: { $sum: '$totalHours' },
          totalOvertimeHours: { $sum: '$overtimeHours' }
        }
      },
      {
        $project: {
          _id: 1,
          employee: {
            _id: '$employeeData._id',
            firstName: '$employeeData.firstName',
            lastName: '$employeeData.lastName',
            employeeId: '$employeeData.employeeId',
            department: '$employeeData.department'
          },
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          totalHours: 1,
          totalOvertimeHours: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { 'employee.firstName': 1 } }
    );

    const report = await Attendance.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        report,
        period: {
          startDate: start,
          endDate: end
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating attendance report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// =============================================================================
// PAYROLL CONTROLLERS (Basic)
// =============================================================================

export const getPayrollSummary = async (req: Request, res: Response) => {
  try {
    const { month, year, employee } = req.query;
    const companyId = (req as any).user.company;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const employeeFilter: any = { companyId, status: 'active' };
    if (employee) {
      employeeFilter._id = employee;
    }

    const employees = await Employee.find(employeeFilter);

    const payrollData = await Promise.all(
      employees.map(async (emp) => {
        // Get attendance for the month
        const attendance = await Attendance.find({
          employee: emp._id,
          companyId,
          date: { $gte: startDate, $lte: endDate }
        });

        const totalHours = attendance.reduce((sum, att) => sum + att.totalHours, 0);
        const overtimeHours = attendance.reduce((sum, att) => sum + att.overtimeHours, 0);
        const presentDays = attendance.filter(att => att.status === 'present').length;
        const workingDays = attendance.length;

        // Basic payroll calculation
        const baseSalary = emp.salary || 0;
        const overtimeRate = (baseSalary / (30 * 8)) * 1.5; // 1.5x for overtime
        const overtimePay = overtimeHours * overtimeRate;
        const grossPay = baseSalary + overtimePay;

        // Basic deductions (simplified)
        const taxDeduction = grossPay * 0.1; // 10% tax
        const socialSecurity = grossPay * 0.05; // 5% social security
        const totalDeductions = taxDeduction + socialSecurity;
        const netPay = grossPay - totalDeductions;

        return {
          employee: {
            _id: emp._id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            employeeId: emp.employeeId,
            department: emp.department,
            position: emp.position
          },
          period: { month: Number(month), year: Number(year) },
          salary: {
            baseSalary,
            overtimePay,
            grossPay,
            netPay
          },
          deductions: {
            tax: taxDeduction,
            socialSecurity,
            total: totalDeductions
          },
          attendance: {
            totalHours,
            overtimeHours,
            presentDays,
            workingDays,
            attendancePercentage: workingDays > 0 ? (presentDays / workingDays) * 100 : 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        payroll: payrollData,
        summary: {
          totalEmployees: payrollData.length,
          totalGrossPay: payrollData.reduce((sum, p) => sum + p.salary.grossPay, 0),
          totalNetPay: payrollData.reduce((sum, p) => sum + p.salary.netPay, 0),
          totalDeductions: payrollData.reduce((sum, p) => sum + p.deductions.total, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating payroll summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get pending invitations for employees
export const getPendingEmployeeInvitations = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    const pendingInvitations = await Token.find({
      company: companyId,
      type: 'invite',
      role: 'employee',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).select('email metadata.employeeData expiresAt createdAt');

    const formattedInvitations = pendingInvitations.map(invite => ({
      email: invite.email,
      firstName: invite.metadata?.employeeData?.firstName || '',
      lastName: invite.metadata?.employeeData?.lastName || '',
      department: invite.metadata?.employeeData?.department || '',
      position: invite.metadata?.employeeData?.position || '',
      status: 'invited',
      invitedAt: invite.createdAt,
      expiresAt: invite.expiresAt
    }));

    res.json({
      success: true,
      data: {
        invitations: formattedInvitations,
        total: formattedInvitations.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
