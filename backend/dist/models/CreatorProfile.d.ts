import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ICreatorProfile, {}, {}, {}, mongoose.Document<unknown, {}, ICreatorProfile, {}, mongoose.DefaultSchemaOptions> & ICreatorProfile & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICreatorProfile>;
export default _default;
//# sourceMappingURL=CreatorProfile.d.ts.map