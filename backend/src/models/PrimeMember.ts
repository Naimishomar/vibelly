import mongoose, { Document, Schema } from 'mongoose';

export interface IPrimeMember extends Document {
  creator: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  roomCode?: string; // optional: specific room or all rooms
  addedBy: mongoose.Types.ObjectId; // creator who added
  createdAt: Date;
}

const PrimeMemberSchema: Schema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomCode: { type: String },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

PrimeMemberSchema.index({ creator: 1, user: 1, roomCode: 1 }, { unique: true });
PrimeMemberSchema.index({ creator: 1 });
PrimeMemberSchema.index({ user: 1 });

export default mongoose.model<IPrimeMember>('PrimeMember', PrimeMemberSchema);