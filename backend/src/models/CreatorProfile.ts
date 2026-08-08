import mongoose, { Document, Schema } from 'mongoose';

export interface ICreatorProfile extends Document {
  user: mongoose.Types.ObjectId;
  bio: string;
  coverImage: string;
  galleryPhotos: string[];
  subscriptionPrice: number;
  upiId?: string;
  bankAccount?: string;
  verification: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    selfieUrl: string;
    idUrl: string;
    submittedAt?: Date;
    reviewedAt?: Date;
    rejectReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CreatorProfileSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, default: '', maxlength: 500 },
  coverImage: { type: String, default: '' },
  galleryPhotos: [{ type: String }],
  subscriptionPrice: { type: Number, default: 0 },
  upiId: { type: String, default: '' },
  bankAccount: { type: String, default: '' },
  verification: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    selfieUrl: { type: String, default: '' },
    idUrl: { type: String, default: '' },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    rejectReason: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

export default mongoose.model<ICreatorProfile>('CreatorProfile', CreatorProfileSchema);
