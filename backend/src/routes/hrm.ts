import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  // Employee controllers
  getEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getPendingEmployeeInvitations,
  
  // Department controllers
  getDepartments,
  createDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  
  // Leave request controllers
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveRequestStatus,
  
  // Attendance controllers
  clockInOut,
  getAttendance,
  createAttendance,
  updateAttendance,
  getAttendanceReport,
  
  // Payroll controllers
  getPayrollSummary,
  
  // Dashboard
  getHrmDashboard
} from '../controllers/hrmController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard', asyncHandler(getHrmDashboard));

// Employee routes
router.get('/employees', asyncHandler(getEmployees));
router.post('/employees', asyncHandler(createEmployee));
router.get('/employees/:id', asyncHandler(getEmployee));
router.put('/employees/:id', asyncHandler(updateEmployee));
router.delete('/employees/:id', asyncHandler(deleteEmployee));
router.get('/employees/invitations/pending', asyncHandler(getPendingEmployeeInvitations));

// Department routes
router.get('/departments', asyncHandler(getAllDepartments));
router.post('/departments', asyncHandler(createDepartment));
router.get('/departments/:id', asyncHandler(getDepartment));
router.put('/departments/:id', asyncHandler(updateDepartment));
router.delete('/departments/:id', asyncHandler(deleteDepartment));
router.get('/departments-summary', asyncHandler(getDepartments)); // Legacy endpoint

// Leave request routes
router.get('/leave-requests', asyncHandler(getLeaveRequests));
router.post('/leave-requests', asyncHandler(createLeaveRequest));
router.get('/leave-requests/:id', asyncHandler(getLeaveRequest));
router.put('/leave-requests/:id/status', asyncHandler(updateLeaveRequestStatus));

// Attendance routes
router.get('/attendance', asyncHandler(getAttendance));
router.post('/attendance', asyncHandler(createAttendance));
router.put('/attendance/:id', asyncHandler(updateAttendance));
router.post('/attendance/clock', asyncHandler(clockInOut));
router.get('/attendance/report', asyncHandler(getAttendanceReport));

// Payroll routes
router.get('/payroll/summary', asyncHandler(getPayrollSummary));

export default router;
