import mongoose, { Document, Schema } from 'mongoose';

export interface IStockMovement extends Document {
  product: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  reference?: string; // PO number, sales order, etc.
  fromWarehouse?: mongoose.Types.ObjectId; // for transfers
  toWarehouse?: mongoose.Types.ObjectId; // for transfers
  supplier?: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId; // user who performed the action
  notes?: string;
  previousQuantity: number; // stock balance before this movement
  newQuantity: number; // stock balance after this movement (same as balanceAfter)
  balanceAfter: number; // stock balance after this movement
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'transfer'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitCost: {
    type: Number,
    min: 0
  },
  totalCost: {
    type: Number,
    min: 0
  },
  reason: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  fromWarehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  toWarehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  previousQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  newQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
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
stockMovementSchema.index({ companyId: 1, product: 1, createdAt: -1 });
stockMovementSchema.index({ companyId: 1, warehouse: 1, createdAt: -1 });
stockMovementSchema.index({ companyId: 1, type: 1, createdAt: -1 });
stockMovementSchema.index({ companyId: 1, performedBy: 1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);
