import mongoose, { Document, Schema } from 'mongoose';

export interface IProfileSubscription extends Document {
  subscriber: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  price: number;
  currency: string;
  creatorShare: number;
  platformShare: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: 'active' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

const ProfileSubscriptionSchema: Schema = new Schema({
  subscriber: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  creatorShare: { type: Number, required: true },
  platformShare: { type: Number, required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
});

ProfileSubscriptionSchema.index({ subscriber: 1, creator: 1 });
ProfileSubscriptionSchema.index({ creator: 1, status: 1 });

export default mongoose.model<IProfileSubscription>('ProfileSubscription', ProfileSubscriptionSchema);
