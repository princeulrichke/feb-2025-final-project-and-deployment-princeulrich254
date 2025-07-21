import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  status: 'Active' | 'Inactive' | 'Converted' | 'Dead';
  source: 'Website' | 'Referral' | 'Cold Call' | 'Email Campaign' | 'Social Media' | 'Trade Show' | 'Other';
  value?: number;
  probability?: number; // 0-100
  notes?: string;
  tags: string[];
  assignedTo: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  
  // Lead specific fields
  leadScore?: number; // 0-100
  industry?: string;
  budget?: number;
  timeline?: string;
  painPoints?: string[];
  interests?: string[];
  
  // Tracking fields
  firstContactDate?: Date;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  expectedCloseDate?: Date;
  
  // Conversion tracking
  convertedToCustomer?: boolean;
  convertedDate?: Date;
  customerId?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>({
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
  stage: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'New'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Converted', 'Dead'],
    default: 'Active'
  },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Cold Call', 'Email Campaign', 'Social Media', 'Trade Show', 'Other'],
    required: true
  },
  value: {
    type: Number,
    min: 0
  },
  probability: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
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
  leadScore: {
    type: Number,
    min: 0,
    max: 100
  },
  industry: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    min: 0
  },
  timeline: {
    type: String,
    trim: true
  },
  painPoints: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  firstContactDate: Date,
  lastContactDate: Date,
  nextFollowUpDate: Date,
  expectedCloseDate: Date,
  convertedToCustomer: {
    type: Boolean,
    default: false
  },
  convertedDate: Date,
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  }
}, {
  timestamps: true
});

// Indexes for better performance
leadSchema.index({ companyId: 1, status: 1 });
leadSchema.index({ assignedTo: 1, stage: 1 });
leadSchema.index({ email: 1, companyId: 1 }, { unique: true });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ nextFollowUpDate: 1 });

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
