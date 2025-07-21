import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  clockIn: {
    type: Date
  },
  clockOut: {
    type: Date
  },
  breakStart: {
    type: Date
  },
  breakEnd: {
    type: Date
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  regularHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
    default: 'absent'
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, date: 1 });
attendanceSchema.index({ status: 1 });

// Calculate total hours when clock times are updated
attendanceSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut) {
    const totalMs = this.clockOut.getTime() - this.clockIn.getTime();
    let totalHours = totalMs / (1000 * 60 * 60);
    
    // Subtract break time if both break times are set
    if (this.breakStart && this.breakEnd) {
      const breakMs = this.breakEnd.getTime() - this.breakStart.getTime();
      const breakHours = breakMs / (1000 * 60 * 60);
      totalHours -= breakHours;
    }
    
    this.totalHours = Math.max(0, totalHours);
    
    // Calculate regular and overtime hours (assuming 8 hours is regular)
    if (this.totalHours <= 8) {
      this.regularHours = this.totalHours;
      this.overtimeHours = 0;
    } else {
      this.regularHours = 8;
      this.overtimeHours = this.totalHours - 8;
    }
    
    // Update status based on hours
    if (this.totalHours === 0) {
      this.status = 'absent';
    } else if (this.totalHours < 4) {
      this.status = 'half-day';
    } else {
      this.status = 'present';
    }
  }
  
  next();
});

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
