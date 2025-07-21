import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunication extends Document {
  type: 'Email' | 'Phone' | 'Meeting' | 'Note' | 'Task' | 'SMS' | 'Video Call' | 'Social Media';
  direction: 'Inbound' | 'Outbound';
  subject?: string;
  content: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Scheduled';
  
  // Related entities
  leadId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  
  // User and company
  userId: mongoose.Types.ObjectId; // Who initiated/handled the communication
  companyId: mongoose.Types.ObjectId;
  
  // Scheduling
  scheduledDate?: Date;
  completedDate?: Date;
  duration?: number; // in minutes
  
  // Additional data
  attachments?: string[]; // file paths or URLs
  tags: string[];
  isImportant?: boolean;
  followUpRequired?: boolean;
  followUpDate?: Date;
  
  // Metadata
  channel?: string; // specific channel like "Gmail", "Outlook", "Zoom", etc.
  externalId?: string; // ID from external system
  metadata?: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

const communicationSchema = new Schema<ICommunication>({
  type: {
    type: String,
    enum: ['Email', 'Phone', 'Meeting', 'Note', 'Task', 'SMS', 'Video Call', 'Social Media'],
    required: true
  },
  direction: {
    type: String,
    enum: ['Inbound', 'Outbound'],
    required: true
  },
  subject: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled', 'Scheduled'],
    default: 'Completed'
  },
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead'
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  scheduledDate: Date,
  completedDate: Date,
  duration: {
    type: Number,
    min: 0
  },
  attachments: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isImportant: {
    type: Boolean,
    default: false
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  channel: {
    type: String,
    trim: true
  },
  externalId: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better performance
communicationSchema.index({ companyId: 1, type: 1 });
communicationSchema.index({ userId: 1, createdAt: -1 });
communicationSchema.index({ leadId: 1, createdAt: -1 });
communicationSchema.index({ customerId: 1, createdAt: -1 });
communicationSchema.index({ contactId: 1, createdAt: -1 });
communicationSchema.index({ scheduledDate: 1 });
communicationSchema.index({ followUpDate: 1 });
communicationSchema.index({ status: 1 });

export const Communication = mongoose.model<ICommunication>('Communication', communicationSchema);
