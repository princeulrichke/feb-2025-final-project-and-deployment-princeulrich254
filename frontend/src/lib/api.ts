import axios from 'axios'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, 'URL:', error.config?.url)
    
    // Only logout on 401 if it's an authentication/authorization error, not a validation error
    if (error.response?.status === 401 && 
        (error.response?.data?.message?.includes('token') || 
         error.response?.data?.message?.includes('authentication') ||
         error.response?.data?.message?.includes('expired') ||
         error.response?.data?.message === 'Access token required')) {
      // Token expired or invalid
      console.warn('Authentication failed, redirecting to login:', error.response?.data?.message)
      useAuthStore.getState().logout()
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
    
  signup: (data: {
    email: string
    password: string
    confirmPassword: string
    companyName: string
    firstName: string
    lastName: string
    phone?: string
    agreeToTerms: boolean
  }) => api.post('/auth/signup', data),
  
  logout: () => api.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
    
  resetPassword: (data: {
    token: string
    password: string
    confirmPassword: string
  }) => api.post('/auth/reset-password', data),
  
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
    
  resendVerification: () =>
    api.post('/auth/resend-verification'),
    
  me: () => api.get('/auth/me'),
  
  invite: (data: {
    email: string
    role: string
    firstName: string
    lastName: string
    department?: string
  }) => api.post('/auth/invite', data),
  
  acceptInvite: (token: string, data: {
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    department?: string
  }) => api.post(`/auth/accept-invite/${token}`, data),
}

// Users API
export const usersAPI = {
  getUsers: (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
    department?: string
  }) => api.get('/users', { params }),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  updateUser: (id: string, data: {
    firstName?: string
    lastName?: string
    phone?: string
    department?: string
    isActive?: boolean
  }) => api.put(`/users/${id}`, data),
  
  updateUserRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
    
  deactivateUser: (id: string) =>
    api.patch(`/users/${id}/deactivate`),
    
  activateUser: (id: string) =>
    api.patch(`/users/${id}/activate`),
    
  getUserStats: () => api.get('/users/stats/overview'),
}

// Company API
export const companyAPI = {
  getProfile: () => api.get('/company/profile'),
  
  updateProfile: (data: {
    name?: string
    description?: string
    industry?: string
    website?: string
    email?: string
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
    }
  }) => api.put('/company/profile', data),
  
  updateSettings: (data: {
    currency?: string
    timezone?: string
    dateFormat?: string
    fiscalYearStart?: number
  }) => api.put('/company/settings', data),
}

// CRM API
export const crmAPI = {
  // Leads
  getLeads: (params?: {
    page?: number
    limit?: number
    stage?: string
    assignedTo?: string
  }) => api.get('/crm/leads', { params }),
  
  createLead: (data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    position?: string
    stage?: string
    source?: string
    value?: number
    expectedCloseDate?: string
    notes?: string
    assignedTo?: string
  }) => api.post('/crm/leads', data),
  
  updateLead: (id: string, data: any) => api.put(`/crm/leads/${id}`, data),
  
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  
  convertLeadToCustomer: (id: string) => api.post(`/crm/leads/${id}/convert`),
  
  // Contacts
  getContacts: (params?: {
    page?: number
    limit?: number
    search?: string
  }) => api.get('/crm/contacts', { params }),
  
  createContact: (data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    position?: string
    notes?: string
  }) => api.post('/crm/contacts', data),
  
  updateContact: (id: string, data: any) => api.put(`/crm/contacts/${id}`, data),
  
  deleteContact: (id: string) => api.delete(`/crm/contacts/${id}`),
  
  // Customers
  getCustomers: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    priority?: string
    type?: string
  }) => api.get('/crm/customers', { params }),
  
  createCustomer: (data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    position?: string
    type: 'Individual' | 'Business'
    status?: 'Active' | 'Inactive' | 'Suspended'
    priority?: 'Low' | 'Medium' | 'High' | 'VIP'
    industry?: string
    website?: string
    taxId?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
    notes?: string
    tags?: string[]
    leadId?: string
  }) => api.post('/crm/customers', data),
  
  updateCustomer: (id: string, data: any) => api.put(`/crm/customers/${id}`, data),
  
  deleteCustomer: (id: string) => api.delete(`/crm/customers/${id}`),
  
  // Communications
  getCommunications: (params?: {
    page?: number
    limit?: number
    type?: string
    leadId?: string
    customerId?: string
    contactId?: string
  }) => api.get('/crm/communications', { params }),
  
  createCommunication: (data: {
    type: 'Email' | 'Phone' | 'Meeting' | 'Note' | 'Task' | 'SMS' | 'Video Call' | 'Social Media'
    direction: 'Inbound' | 'Outbound'
    subject?: string
    content: string
    status?: 'Pending' | 'Completed' | 'Cancelled' | 'Scheduled'
    leadId?: string
    customerId?: string
    contactId?: string
    scheduledDate?: string
    duration?: number
    tags?: string[]
    isImportant?: boolean
    followUpRequired?: boolean
    followUpDate?: string
  }) => api.post('/crm/communications', data),
  
  updateCommunication: (id: string, data: any) => api.put(`/crm/communications/${id}`, data),
  
  deleteCommunication: (id: string) => api.delete(`/crm/communications/${id}`),
  
  // Dashboard
  getDashboard: () => api.get('/crm/dashboard'),
}

// HRM API
export const hrmAPI = {
  // Dashboard
  getDashboard: () => api.get('/hrm/dashboard'),
  
  // Employees
  getEmployees: (params?: {
    page?: number
    limit?: number
    department?: string
    status?: string
    search?: string
  }) => api.get('/hrm/employees', { params }),
  
  createEmployee: (data: {
    employeeId: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    department: string
    position: string
    hireDate: string
    salary?: number
    status?: string
    manager?: string
    address?: any
    emergencyContact?: any
  }) => api.post('/hrm/employees', data),
  
  getEmployee: (id: string) => api.get(`/hrm/employees/${id}`),
  
  updateEmployee: (id: string, data: any) => api.put(`/hrm/employees/${id}`, data),
  
  deleteEmployee: (id: string) => api.delete(`/hrm/employees/${id}`),
  
  getPendingInvitations: () => api.get('/hrm/employees/invitations/pending'),
  
  // Departments
  getAllDepartments: (params?: {
    page?: number
    limit?: number
    search?: string
  }) => api.get('/hrm/departments', { params }),
  
  createDepartment: (data: {
    name: string
    description?: string
    manager?: string
    budget?: number
  }) => api.post('/hrm/departments', data),
  
  getDepartment: (id: string) => api.get(`/hrm/departments/${id}`),
  
  updateDepartment: (id: string, data: any) => api.put(`/hrm/departments/${id}`, data),
  
  deleteDepartment: (id: string) => api.delete(`/hrm/departments/${id}`),
  
  getDepartments: () => api.get('/hrm/departments-summary'), // Legacy endpoint
  
  // Leave Requests
  getLeaveRequests: (params?: {
    page?: number
    limit?: number
    status?: string
    type?: string
    employee?: string
  }) => api.get('/hrm/leave-requests', { params }),
  
  createLeaveRequest: (data: {
    employee: string
    type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'unpaid'
    startDate: string
    endDate: string
    reason?: string
    isEmergency?: boolean
  }) => api.post('/hrm/leave-requests', data),
  
  getLeaveRequest: (id: string) => api.get(`/hrm/leave-requests/${id}`),
  
  updateLeaveRequestStatus: (id: string, data: {
    status: 'approved' | 'rejected'
    rejectionReason?: string
  }) => api.put(`/hrm/leave-requests/${id}/status`, data),
  
  // Attendance
  getAttendance: (params?: {
    page?: number
    limit?: number
    employee?: string
    date?: string
    status?: string
  }) => api.get('/hrm/attendance', { params }),
  
  createAttendance: (data: {
    employee: string
    date: string
    clockIn?: string
    clockOut?: string
    breakStart?: string
    breakEnd?: string
    status?: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave'
    notes?: string
  }) => api.post('/hrm/attendance', data),
  
  updateAttendance: (id: string, data: any) => api.put(`/hrm/attendance/${id}`, data),
  
  clockInOut: (data: {
    employee: string
    action: 'clock-in' | 'clock-out' | 'break-start' | 'break-end'
    location?: {
      latitude: number
      longitude: number
      address: string
    }
  }) => api.post('/hrm/attendance/clock', data),
  
  getAttendanceReport: (params: {
    startDate: string
    endDate: string
    employee?: string
    department?: string
  }) => api.get('/hrm/attendance/report', { params }),
  
  // Payroll
  getPayrollSummary: (params: {
    month: number
    year: number
    employee?: string
  }) => api.get('/hrm/payroll/summary', { params }),
}

// ERP API (placeholder for future implementation)
export const erpAPI = {
  getProjects: () => api.get('/erp/projects'),
  getTasks: () => api.get('/erp/tasks'),
  getOperations: () => api.get('/erp/operations'),
}

// Inventory API
export const inventoryAPI = {
  // Products
  getProducts: (params?: {
    page?: number
    limit?: number
    category?: string
    status?: string
    search?: string
    lowStock?: boolean
  }) => api.get('/inventory/products', { params }),
  
  createProduct: (data: {
    name: string
    description?: string
    sku: string
    category: string
    price: number
    cost?: number
    quantity: number
    minQuantity: number
    unit: string
    status?: string
    supplier?: any
    images?: string[]
    barcode?: string
    weight?: number
    dimensions?: any
  }) => api.post('/inventory/products', data),
  
  getProduct: (id: string) => api.get(`/inventory/products/${id}`),
  
  updateProduct: (id: string, data: any) => api.put(`/inventory/products/${id}`, data),
  
  deleteProduct: (id: string) => api.delete(`/inventory/products/${id}`),
  
  updateStock: (id: string, data: {
    quantity: number
    type: 'add' | 'subtract' | 'set'
    reason?: string
  }) => api.put(`/inventory/products/${id}/stock`, data),
  
  // Categories and stock
  getCategories: () => api.get('/inventory/categories'),
  getLowStockProducts: () => api.get('/inventory/low-stock'),
  
  // Dashboard
  getDashboard: () => api.get('/inventory/dashboard'),
}

// Accounting API
export const accountingAPI = {
  // Invoices
  getInvoices: (params?: {
    page?: number
    limit?: number
    status?: string
    customer?: string
    startDate?: string
    endDate?: string
  }) => api.get('/accounting/invoices', { params }),
  
  createInvoice: (data: {
    customer: {
      name: string
      email: string
      address?: string
      phone?: string
    }
    items: Array<{
      product?: string
      description: string
      quantity: number
      unitPrice: number
      total: number
    }>
    taxRate: number
    discountAmount?: number
    dueDate: string
    notes?: string
    terms?: string
  }) => api.post('/accounting/invoices', data),
  
  getInvoice: (id: string) => api.get(`/accounting/invoices/${id}`),
  
  updateInvoiceStatus: (id: string, data: {
    status: string
    paidDate?: string
  }) => api.put(`/accounting/invoices/${id}/status`, data),
  
  deleteInvoice: (id: string) => api.delete(`/accounting/invoices/${id}`),
  
  getOverdueInvoices: () => api.get('/accounting/invoices/overdue'),
  getInvoiceStatistics: () => api.get('/accounting/invoices/statistics'),
  
  // Dashboard
  getDashboard: () => api.get('/accounting/dashboard'),
}

// Sales API (placeholder for future implementation)
export const salesAPI = {
  getOrders: () => api.get('/sales/orders'),
  getQuotations: () => api.get('/sales/quotations'),
  getPurchases: () => api.get('/sales/purchases'),
}

// Events API
export const eventsAPI = {
  getEvents: (params?: {
    page?: number
    limit?: number
    type?: string
    status?: string
    startDate?: string
    endDate?: string
    organizer?: string
    priority?: string
  }) => api.get('/events', { params }),
  
  createEvent: (data: {
    title: string
    description?: string
    type?: string
    startDate: string
    endDate: string
    allDay?: boolean
    location?: string
    attendees?: string[]
    status?: string
    priority?: string
    isRecurring?: boolean
    recurrencePattern?: any
    reminders?: any[]
  }) => api.post('/events', data),
  
  getEvent: (id: string) => api.get(`/events/${id}`),
  
  updateEvent: (id: string, data: any) => api.put(`/events/${id}`, data),
  
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  
  getUpcomingEvents: (limit?: number) => api.get('/events/upcoming', {
    params: { limit }
  }),
  
  getCalendarEvents: (startDate: string, endDate: string) => api.get('/events/calendar', {
    params: { startDate, endDate }
  }),
  
  // Dashboard
  getDashboard: () => api.get('/events/dashboard'),
}

export default api
