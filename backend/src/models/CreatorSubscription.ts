import mongoose, { Document, Schema } from 'mongoose';

export interface ICreatorSubscription extends Document {
  creator: mongoose.Types.ObjectId;
  price: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreatorSubscriptionSchema: Schema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
});

CreatorSubscriptionSchema.index({ creator: 1 });
CreatorSubscriptionSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<ICreatorSubscription>('CreatorSubscription', CreatorSubscriptionSchema);