import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryAccess extends Document {
  user: mongoose.Types.ObjectId;
  accessLevel: 'view' | 'edit';
  grantedBy: mongoose.Types.ObjectId; // who granted the access
  grantedAt: Date;
  isActive: boolean;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryAccessSchema = new Schema<IInventoryAccess>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['view', 'edit'],
    required: true
  },
  grantedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
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
inventoryAccessSchema.index({ companyId: 1, user: 1 }, { unique: true });
inventoryAccessSchema.index({ companyId: 1, isActive: 1 });

export const InventoryAccess = mongoose.model<IInventoryAccess>('InventoryAccess', inventoryAccessSchema);
