import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface ICreatorPost extends Document {
  creator: mongoose.Types.ObjectId;
  images: string[];        // up to 3 Cloudflare R2 URLs
  imageKeys: string[];     // R2 s3Keys for deletion
  caption: string;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const CreatorPostSchema = new Schema<ICreatorPost>(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    images: {
      type: [String],
      validate: {
        validator: (arr: string[]) => arr.length >= 1 && arr.length <= 3,
        message: 'A post must have 1-3 photos',
      },
    },
    imageKeys: [{ type: String }],
    caption: { type: String, default: '', maxlength: 500 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

// Newest-first index
CreatorPostSchema.index({ creator: 1, createdAt: -1 });

export default mongoose.model<ICreatorPost>('CreatorPost', CreatorPostSchema);
