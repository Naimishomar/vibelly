import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  reportedUser: mongoose.Types.ObjectId;
  reason: string;
  type: 'call' | 'live' | 'profile' | 'paid-no-show';
  roomCode?: string;
  streamTitle?: string;
  amountPaid?: number;
  createdAt: Date;
}

const ReportSchema: Schema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  type: { type: String, enum: ['call', 'live', 'profile', 'paid-no-show'], default: 'call' },
  roomCode: { type: String, default: '' },
  streamTitle: { type: String, default: '' },
  amountPaid: { type: Number },
}, {
  timestamps: true,
});

export default mongoose.model<IReport>('Report', ReportSchema);
