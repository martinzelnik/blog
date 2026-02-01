import mongoose from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  username: string;
  text: string;
}

const CommentSchema = new mongoose.Schema<IComment>(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: 'comments' }
);

export default mongoose.models.Comment ?? mongoose.model<IComment>('Comment', CommentSchema);
