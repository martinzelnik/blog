import './PostItem.css';
import DeleteButton from './DeleteButton';

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  language: 'en' | 'cs';
}

interface PostProps {
  post: Post;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function PostItem({ post, onDelete, isDeleting = false }: PostProps) {
  return (
    <article className="post">
      <DeleteButton
        onDelete={() => onDelete(post.id)}
        loading={isDeleting}
      />
      <h2>{post.title}</h2>
      <p className="date">{post.date}</p>
      <div className="post-content-wrapper">
        {post.image && <img src={post.image} alt={post.title} className="post-image" />}
        <p className="post-text">{post.content}</p>
      </div>
    </article>
  );
}

export default PostItem;
