import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ICreatorSubscription, {}, {}, {}, mongoose.Document<unknown, {}, ICreatorSubscription, {}, mongoose.DefaultSchemaOptions> & ICreatorSubscription & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICreatorSubscription>;
export default _default;
//# sourceMappingURL=CreatorSubscription.d.ts.map