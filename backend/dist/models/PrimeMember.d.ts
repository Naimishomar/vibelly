import mongoose, { Document } from 'mongoose';
export interface IPrimeMember extends Document {
    creator: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    roomCode?: string;
    addedBy: mongoose.Types.ObjectId;
    createdAt: Date;
}
declare const _default: mongoose.Model<IPrimeMember, {}, {}, {}, mongoose.Document<unknown, {}, IPrimeMember, {}, mongoose.DefaultSchemaOptions> & IPrimeMember & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPrimeMember>;
export default _default;
//# sourceMappingURL=PrimeMember.d.ts.map