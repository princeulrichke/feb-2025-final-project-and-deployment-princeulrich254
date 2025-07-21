import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  type: 'email_verification' | 'password_reset' | 'invite';
  email?: string; // For invite tokens
  role?: string; // For invite tokens
  company?: mongoose.Types.ObjectId; // For invite tokens
  metadata?: any; // For storing additional data like employee info
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Allow null for invite tokens
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['email_verification', 'password_reset', 'invite'],
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'employee', 'accountant', 'sales_rep', 'hr_manager']
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  metadata: {
    type: Schema.Types.Mixed, // Flexible field for storing additional data
    default: null
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
tokenSchema.index({ token: 1, type: 1 });
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ email: 1, type: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Token = mongoose.model<IToken>('Token', tokenSchema);
