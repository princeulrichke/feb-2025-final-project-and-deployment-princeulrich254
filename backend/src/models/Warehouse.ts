import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  code: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  capacity?: number;
  manager?: {
    name: string;
    email: string;
    phone: string;
  };
  isActive: boolean;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  capacity: {
    type: Number,
    min: 0
  },
  manager: {
    name: String,
    email: String,
    phone: String
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
warehouseSchema.index({ companyId: 1, code: 1 }, { unique: true });
warehouseSchema.index({ companyId: 1, isActive: 1 });

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', warehouseSchema);
