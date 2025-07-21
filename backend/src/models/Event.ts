import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  type: 'meeting' | 'conference' | 'training' | 'deadline' | 'reminder' | 'other';
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  organizer: mongoose.Types.ObjectId;
  attendees: mongoose.Types.ObjectId[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  reminders?: {
    type: 'email' | 'notification';
    minutesBefore: number;
  }[];
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['meeting', 'conference', 'training', 'deadline', 'reminder', 'other'],
    default: 'meeting'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1
    },
    endDate: Date
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification']
    },
    minutesBefore: {
      type: Number,
      min: 0
    }
  }],
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
eventSchema.index({ companyId: 1, startDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ attendees: 1 });
eventSchema.index({ status: 1 });

// Virtual for duration in minutes
eventSchema.virtual('durationMinutes').get(function() {
  return Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60));
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);
