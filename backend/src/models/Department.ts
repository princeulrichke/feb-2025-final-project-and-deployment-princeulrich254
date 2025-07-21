import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  manager?: mongoose.Types.ObjectId;
  employeeCount: number;
  budget?: number;
  isActive: boolean;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  employeeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  budget: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });
departmentSchema.index({ manager: 1 });

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
