import mongoose, { Document, Schema } from 'mongoose';

export interface ILivePayment extends Document {
  viewer: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  roomCode: string;
  amount: number;
  currency: string;
  creatorShare: number;
  platformShare: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: 'paid' | 'refunded';
  createdAt: Date;
}

const LivePaymentSchema: Schema = new Schema({
  viewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomCode: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  creatorShare: { type: Number, required: true },
  platformShare: { type: Number, required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
}, {
  timestamps: true,
});

export default mongoose.model<ILivePayment>('LivePayment', LivePaymentSchema);
