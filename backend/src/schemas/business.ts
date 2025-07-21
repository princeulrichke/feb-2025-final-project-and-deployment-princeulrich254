import { z } from 'zod';

// Lead schemas
export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  source: z.enum(['website', 'referral', 'social_media', 'advertisement', 'cold_call', 'email_campaign', 'other']).optional(),
  value: z.number().min(0, 'Value must be positive').optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  assignedTo: z.string().optional()
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

// Contact schemas
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional()
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

// Employee schemas
export const createEmployeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').max(20),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required').max(100),
  position: z.string().min(1, 'Position is required').max(100),
  hireDate: z.string().min(1, 'Hire date is required'),
  salary: z.number().min(0, 'Salary must be positive').optional(),
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

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.string().min(1, 'Category is required').max(100),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  quantity: z.number().min(0, 'Quantity must be positive'),
  minQuantity: z.number().min(0, 'Minimum quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').max(20),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  supplier: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string()
  }).optional(),
  images: z.array(z.string()).optional(),
  barcode: z.string().optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  type: z.enum(['meeting', 'conference', 'training', 'deadline', 'reminder', 'other']).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().min(1),
    endDate: z.string().optional()
  }).optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'notification']),
    minutesBefore: z.number().min(0)
  })).optional()
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

// Invoice schemas
export const createInvoiceItemSchema = z.object({
  product: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  total: z.number().min(0, 'Total must be positive')
});

export const createInvoiceSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Customer name is required').max(100),
    email: z.string().email('Invalid email format'),
    address: z.string().optional(),
    phone: z.string().optional()
  }),
  items: z.array(createInvoiceItemSchema).min(1, 'At least one item is required'),
  taxRate: z.number().min(0, 'Tax rate must be positive').max(1, 'Tax rate cannot exceed 100%'),
  discountAmount: z.number().min(0, 'Discount must be positive').optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  terms: z.string().max(1000, 'Terms must be less than 1000 characters').optional()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
