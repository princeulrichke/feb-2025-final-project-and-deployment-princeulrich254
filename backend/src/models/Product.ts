import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  sku: string;
  category: mongoose.Types.ObjectId | string;
  price: number;
  cost?: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  supplier?: mongoose.Types.ObjectId;
  warehouse?: mongoose.Types.ObjectId;
  location?: string; // specific location within warehouse (e.g., "A-1-B")
  images?: string[];
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  sku: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  warehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  location: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  barcode: {
    type: String,
    trim: true
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
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
productSchema.index({ companyId: 1, status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ sku: 1, companyId: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for low stock warning
productSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minQuantity;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
