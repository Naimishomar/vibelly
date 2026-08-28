import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IReport, {}, {}, {}, mongoose.Document<unknown, {}, IReport, {}, mongoose.DefaultSchemaOptions> & IReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IReport>;
export default _default;
//# sourceMappingURL=Report.d.ts.map