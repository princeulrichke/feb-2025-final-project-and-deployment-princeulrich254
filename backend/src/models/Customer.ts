import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: 'Individual' | 'Business';
  status: 'Active' | 'Inactive' | 'Suspended';
  priority: 'Low' | 'Medium' | 'High' | 'VIP';
  
  // Business info
  industry?: string;
  website?: string;
  taxId?: string;
  
  // Address information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Relationship info
  assignedTo: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId; // Reference to original lead
  
  // Customer value
  totalValue?: number;
  lifetimeValue?: number;
  averageOrderValue?: number;
  lastPurchaseDate?: Date;
  
  // Additional info
  notes?: string;
  tags: string[];
  customFields?: Record<string, any>;
  
  // Dates
  customerSince?: Date;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Individual', 'Business'],
    required: true,
    default: 'Individual'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'VIP'],
    default: 'Medium'
  },
  industry: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead'
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  lifetimeValue: {
    type: Number,
    default: 0,
    min: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: Date,
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Schema.Types.Mixed
  },
  customerSince: {
    type: Date,
    default: Date.now
  },
  lastContactDate: Date,
  nextFollowUpDate: Date
}, {
  timestamps: true
});

// Indexes for better performance
customerSchema.index({ companyId: 1, status: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ email: 1, companyId: 1 }, { unique: true });
customerSchema.index({ type: 1, priority: 1 });
customerSchema.index({ customerSince: -1 });
customerSchema.index({ lastContactDate: -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
