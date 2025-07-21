import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    position: String
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 1000
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
supplierSchema.index({ companyId: 1, email: 1 }, { unique: true });
supplierSchema.index({ companyId: 1, isActive: 1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
