import mongoose, { Document } from 'mongoose';
export interface IFollow extends Document {
    follower: mongoose.Types.ObjectId;
    following: mongoose.Types.ObjectId;
    createdAt: Date;
}
declare const _default: mongoose.Model<IFollow, {}, {}, {}, mongoose.Document<unknown, {}, IFollow, {}, mongoose.DefaultSchemaOptions> & IFollow & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFollow>;
export default _default;
//# sourceMappingURL=Follow.d.ts.map