import mongoose, { Document } from 'mongoose';
export interface IComment {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
}
export interface ICreatorPost extends Document {
    creator: mongoose.Types.ObjectId;
    images: string[];
    imageKeys: string[];
    caption: string;
    likes: mongoose.Types.ObjectId[];
    comments: IComment[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICreatorPost, {}, {}, {}, mongoose.Document<unknown, {}, ICreatorPost, {}, mongoose.DefaultSchemaOptions> & ICreatorPost & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICreatorPost>;
export default _default;
//# sourceMappingURL=CreatorPost.d.ts.map