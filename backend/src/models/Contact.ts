import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: 'Lead' | 'Customer' | 'Partner' | 'Vendor' | 'Other';
  status: 'Active' | 'Inactive';
  source?: string;
  notes?: string;
  tags: string[];
  
  // Relationship tracking
  leadId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  
  // Contact details
  department?: string;
  jobTitle?: string;
  birthday?: Date;
  
  // Social profiles
  linkedIn?: string;
  twitter?: string;
  facebook?: string;
  
  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Tracking
  lastContactDate?: Date;
  nextFollowUp?: Date;
  contactFrequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  
  // Ownership
  owner: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
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
    enum: ['Lead', 'Customer', 'Partner', 'Vendor', 'Other'],
    default: 'Lead'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  source: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead'
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  department: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  birthday: Date,
  linkedIn: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  facebook: {
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
  lastContactDate: Date,
  nextFollowUp: Date,
  contactFrequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
ContactSchema.index({ email: 1, companyId: 1 }, { unique: true });
ContactSchema.index({ owner: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ companyId: 1 });

// Virtual for full name
ContactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
