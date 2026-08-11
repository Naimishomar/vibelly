import mongoose, { Document } from 'mongoose';
export interface ILivePayment extends Document {
    viewer: mongoose.Types.ObjectId;
    creator: mongoose.Types.ObjectId;
    roomCode: string;
    amount: number;
    currency: string;
    creatorShare: number;
    platformShare: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paymentMethod: 'razorpay' | 'upi';
    utr?: string;
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ILivePayment, {}, {}, {}, mongoose.Document<unknown, {}, ILivePayment, {}, mongoose.DefaultSchemaOptions> & ILivePayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ILivePayment>;
export default _default;
//# sourceMappingURL=LivePayment.d.ts.map