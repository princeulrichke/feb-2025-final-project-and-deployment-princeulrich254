'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Users,
  Plus,
  Search,
  Clock,
  DollarSign,
  Award,
  UserCheck,
  Building2,
  CalendarDays,
  ClockIcon,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { hrmAPI } from '@/lib/api'

interface Employee {
  _id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department: string
  position: string
  hireDate: string
  salary?: number
  status: 'active' | 'inactive' | 'terminated'
  manager?: {
    _id: string
    firstName: string
    lastName: string
    position: string
  }
}

interface Department {
  _id: string
  name: string
  description?: string
  manager?: {
    _id: string
    firstName: string
    lastName: string
    position: string
  }
  employeeCount: number
  budget?: number
  isActive: boolean
}

interface LeaveRequest {
  _id: string
  employee: {
    _id: string
    firstName: string
    lastName: string
    employeeId: string
    department: string
  }
  type: string
  startDate: string
  endDate: string
  days: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approvedBy?: {
    _id: string
    firstName: string
    lastName: string
  }
  approvedDate?: string
  rejectionReason?: string
  isEmergency: boolean
}

interface Attendance {
  _id: string
  employee: {
    _id: string
    firstName: string
    lastName: string
    employeeId: string
    department: string
  }
  date: string
  clockIn?: string
  clockOut?: string
  breakStart?: string
  breakEnd?: string
  totalHours: number
  regularHours: number
  overtimeHours: number
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave'
  notes?: string
}

interface PendingInvitation {
  email: string
  firstName: string
  lastName: string
  department: string
  position: string
  status: string
  invitedAt: string
  expiresAt: string
}

export default function HRMPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false)
  const [isCreateDepartmentOpen, setIsCreateDepartmentOpen] = useState(false)
  const [isCreateLeaveRequestOpen, setIsCreateLeaveRequestOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [newDepartmentName, setNewDepartmentName] = useState<string>('')
  const [isCreatingNewDepartment, setIsCreatingNewDepartment] = useState(false)

  // Dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['hrm-dashboard'],
    queryFn: () => hrmAPI.getDashboard()
  })

  // Employees data
  const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['hrm-employees'],
    queryFn: () => hrmAPI.getEmployees()
  })

  // Departments data
  const { data: departmentsData, isLoading: departmentsLoading, refetch: refetchDepartments } = useQuery({
    queryKey: ['hrm-departments'],
    queryFn: () => hrmAPI.getAllDepartments()
  })

  // Leave requests data
  const { data: leaveRequestsData, isLoading: leaveRequestsLoading, refetch: refetchLeaveRequests } = useQuery({
    queryKey: ['hrm-leave-requests'],
    queryFn: () => hrmAPI.getLeaveRequests()
  })

  // Attendance data
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ['hrm-attendance', attendanceDate],
    queryFn: () => hrmAPI.getAttendance({ date: attendanceDate })
  })

  // Pending invitations data
  const { data: pendingInvitationsData, isLoading: pendingInvitationsLoading, refetch: refetchPendingInvitations } = useQuery({
    queryKey: ['hrm-pending-invitations'],
    queryFn: () => hrmAPI.getPendingInvitations()
  })

  const handleCreateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const departmentToUse = isCreatingNewDepartment ? newDepartmentName : selectedDepartment
      
      if (!departmentToUse) {
        toast.error('Please select or enter a department name')
        return
      }
      
      const response = await hrmAPI.createEmployee({
        employeeId: formData.get('employeeId') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || undefined,
        department: departmentToUse,
        position: formData.get('position') as string,
        hireDate: new Date(formData.get('hireDate') as string).toISOString(),
        salary: formData.get('salary') ? Number(formData.get('salary')) : undefined,
      })
      
      // Show success popup for invite sent
      toast.success(`Invitation sent successfully to ${formData.get('firstName')} ${formData.get('lastName')}! They will receive an email to join the company.`, {
        duration: 5000,
      })
      
      setIsCreateEmployeeOpen(false)
      refetchEmployees()
      refetchPendingInvitations() // Refresh pending invitations
      refetchDepartments() // Refresh departments in case a new one was created
      
      // Reset form and states
      e.currentTarget.reset()
      setSelectedDepartment('')
      setNewDepartmentName('')
      setIsCreatingNewDepartment(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send employee invitation')
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await hrmAPI.createDepartment({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        manager: formData.get('manager') as string || undefined,
        budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
      })
      
      toast.success('Department created successfully')
      setIsCreateDepartmentOpen(false)
      refetchDepartments()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create department')
    }
  }

  const handleCreateLeaveRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await hrmAPI.createLeaveRequest({
        employee: formData.get('employee') as string,
        type: formData.get('type') as any,
        startDate: new Date(formData.get('startDate') as string).toISOString(),
        endDate: new Date(formData.get('endDate') as string).toISOString(),
        reason: formData.get('reason') as string || undefined,
        isEmergency: formData.get('isEmergency') === 'on',
      })
      
      toast.success('Leave request created successfully')
      setIsCreateLeaveRequestOpen(false)
      refetchLeaveRequests()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create leave request')
    }
  }

  const handleClockAction = async (action: 'clock-in' | 'clock-out' | 'break-start' | 'break-end') => {
    if (!selectedEmployee) {
      toast.error('Please select an employee')
      return
    }

    try {
      await hrmAPI.clockInOut({
        employee: selectedEmployee,
        action,
      })
      
      toast.success(`${action.replace('-', ' ')} recorded successfully`)
      refetchAttendance()
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to record ${action}`)
    }
  }

  const handleApproveLeaveRequest = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      await hrmAPI.updateLeaveRequestStatus(id, { status, rejectionReason })
      toast.success(`Leave request ${status} successfully`)
      refetchLeaveRequests()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update leave request')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const },
      inactive: { variant: 'secondary' as const },
      terminated: { variant: 'destructive' as const },
      pending: { variant: 'outline' as const },
      approved: { variant: 'default' as const },
      rejected: { variant: 'destructive' as const },
      present: { variant: 'default' as const },
      absent: { variant: 'destructive' as const },
      late: { variant: 'outline' as const },
      'half-day': { variant: 'secondary' as const },
      'on-leave': { variant: 'outline' as const },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge variant={config.variant} className="capitalize">
        {status.replace('-', ' ')}
      </Badge>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Human Resource Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="leave-requests" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Leave
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payroll
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {dashboardLoading ? (
            <div>Loading dashboard...</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.data?.data?.statistics?.totalEmployees || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.data?.data?.statistics?.activeEmployees || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Hires (30 days)</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.data?.data?.statistics?.newHires || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Leave Requests</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.data?.data?.statistics?.pendingLeaveRequests || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Department Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.data?.data?.charts?.departmentDistribution?.map((dept: any) => (
                        <div key={dept._id} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dept._id}</span>
                          <span className="text-sm text-muted-foreground">{dept.count} employees</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Today&apos;s Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.data?.data?.charts?.todayAttendance?.map((status: any) => (
                        <div key={status._id} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{status._id.replace('-', ' ')}</span>
                          <span className="text-sm text-muted-foreground">{status.count} employees</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search employees..." className="w-[300px]" />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <Dialog open={isCreateEmployeeOpen} onOpenChange={setIsCreateEmployeeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Invite New Employee</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new employee. They will receive an email to join your organization and set up their account.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEmployee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input id="employeeId" name="employeeId" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <div className="space-y-2">
                        <Select value={isCreatingNewDepartment ? 'new' : selectedDepartment} onValueChange={(value) => {
                          if (value === 'new') {
                            setIsCreatingNewDepartment(true)
                            setSelectedDepartment('')
                          } else {
                            setIsCreatingNewDepartment(false)
                            setSelectedDepartment(value)
                            setNewDepartmentName('')
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departmentsLoading ? (
                              <SelectItem value="loading">Loading departments...</SelectItem>
                            ) : (
                              <>
                                {departmentsData?.data?.data?.departments?.map((dept: Department) => (
                                  <SelectItem key={dept._id} value={dept.name}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="new">+ Create New Department</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {isCreatingNewDepartment && (
                          <Input 
                            placeholder="Enter new department name" 
                            value={newDepartmentName}
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                            required
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input id="position" name="position" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <Input id="hireDate" name="hireDate" type="date" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary (optional)</Label>
                    <Input id="salary" name="salary" type="number" />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateEmployeeOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Send Invitation</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Pending Invitations Section */}
          {pendingInvitationsData?.data?.data?.invitations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Pending Employee Invitations
                </CardTitle>
                <CardDescription>
                  Employees who have been invited but haven&apos;t accepted their invitation yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Invited Date</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitationsData?.data?.data?.invitations?.map((invitation: any) => (
                      <TableRow key={invitation.email}>
                        <TableCell className="font-medium">
                          {invitation.firstName} {invitation.lastName}
                        </TableCell>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{invitation.department}</TableCell>
                        <TableCell>{invitation.position}</TableCell>
                        <TableCell>
                          {invitation.invitedAt ? format(new Date(invitation.invitedAt), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {invitation.expiresAt ? format(new Date(invitation.expiresAt), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Pending
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Active Employees</CardTitle>
              <CardDescription>
                Employees who have accepted their invitation and are active in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div>Loading employees...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesData?.data?.data?.employees?.map((employee: Employee) => (
                      <TableRow key={employee._id}>
                        <TableCell className="font-medium">{employee.employeeId}</TableCell>
                        <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search departments..." className="w-[300px]" />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <Dialog open={isCreateDepartmentOpen} onOpenChange={setIsCreateDepartmentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Department</DialogTitle>
                  <DialogDescription>
                    Add a new department to your organization.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Input id="budget" name="budget" type="number" />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDepartmentOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Department</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Manage your organization&apos;s departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {departmentsLoading ? (
                <div>Loading departments...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Employee Count</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentsData?.data?.data?.departments?.map((department: Department) => (
                      <TableRow key={department._id}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>
                          {department.manager ? 
                            `${department.manager.firstName} ${department.manager.lastName}` : 
                            'No manager'
                          }
                        </TableCell>
                        <TableCell>{department.employeeCount}</TableCell>
                        <TableCell>${department.budget?.toLocaleString() || 'Not set'}</TableCell>
                        <TableCell>{getStatusBadge(department.isActive ? 'active' : 'inactive')}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leave-requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search leave requests..." className="w-[300px]" />
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateLeaveRequestOpen} onOpenChange={setIsCreateLeaveRequestOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Leave Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Leave Request</DialogTitle>
                  <DialogDescription>
                    Submit a new leave request.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateLeaveRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Employee</Label>
                    <Select name="employee">
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeesData?.data?.data?.employees?.map((employee: Employee) => (
                          <SelectItem key={employee._id} value={employee._id}>
                            {employee.firstName} {employee.lastName} ({employee.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Leave Type</Label>
                    <Select name="type">
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="sick">Sick</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="maternity">Maternity</SelectItem>
                        <SelectItem value="paternity">Paternity</SelectItem>
                        <SelectItem value="bereavement">Bereavement</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" name="endDate" type="date" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea id="reason" name="reason" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="isEmergency" name="isEmergency" />
                    <Label htmlFor="isEmergency">Emergency Leave</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateLeaveRequestOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>
                Manage employee leave requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRequestsLoading ? (
                <div>Loading leave requests...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequestsData?.data?.data?.leaveRequests?.filter((request: LeaveRequest) => request.employee).map((request: LeaveRequest) => (
                      <TableRow key={request._id}>
                        <TableCell>
                          {request.employee?.firstName} {request.employee?.lastName}
                          <div className="text-sm text-muted-foreground">{request.employee?.employeeId}</div>
                        </TableCell>
                        <TableCell className="capitalize">{request.type}</TableCell>
                        <TableCell>
                          {request.startDate ? format(new Date(request.startDate), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {request.endDate ? format(new Date(request.endDate), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>{request.days}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveLeaveRequest(request._id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleApproveLeaveRequest(request._id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-[200px]"
              />
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeesData?.data?.data?.employees?.map((employee: Employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => handleClockAction('clock-in')}>
                <Clock className="mr-2 h-4 w-4" />
                Clock In
              </Button>
              <Button onClick={() => handleClockAction('clock-out')}>
                <Clock className="mr-2 h-4 w-4" />
                Clock Out
              </Button>
              <Button variant="outline" onClick={() => handleClockAction('break-start')}>
                Break Start
              </Button>
              <Button variant="outline" onClick={() => handleClockAction('break-end')}>
                Break End
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                View and manage employee attendance for {format(new Date(attendanceDate), 'MMM dd, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div>Loading attendance...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData?.data?.data?.attendance?.filter((record: Attendance) => record.employee).map((record: Attendance) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          {record.employee?.firstName} {record.employee?.lastName}
                          <div className="text-sm text-muted-foreground">{record.employee?.employeeId}</div>
                        </TableCell>
                        <TableCell>
                          {record.clockIn ? format(new Date(record.clockIn), 'hh:mm a') : '-'}
                        </TableCell>
                        <TableCell>
                          {record.clockOut ? format(new Date(record.clockOut), 'hh:mm a') : '-'}
                        </TableCell>
                        <TableCell>
                          {record.breakStart && record.breakEnd 
                            ? `${format(new Date(record.breakStart), 'hh:mm')} - ${format(new Date(record.breakEnd), 'hh:mm')}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{record.totalHours?.toFixed(2)}h</TableCell>
                        <TableCell>{record.overtimeHours?.toFixed(2)}h</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
              <CardDescription>
                Basic payroll calculations (demo feature)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Payroll Module</h3>
                <p className="text-muted-foreground">
                  This feature calculates basic payroll based on attendance and salary information.
                  Select a month and year to generate payroll summary.
                </p>
                <div className="mt-4 flex justify-center space-x-4">
                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>Generate Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
