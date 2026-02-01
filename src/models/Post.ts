import mongoose from 'mongoose';

export interface IPost {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  date: string;
  image?: string;
  language: 'en' | 'cs';
  likedBy?: mongoose.Types.ObjectId[];
}

const PostSchema = new mongoose.Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: String, required: true },
    image: { type: String, required: false },
    language: { type: String, enum: ['en', 'cs'], required: true },
    likedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: () => [] },
  },
  { timestamps: true, collection: 'posts' }
);

export default mongoose.models.Post ?? mongoose.model<IPost>('Post', PostSchema);
