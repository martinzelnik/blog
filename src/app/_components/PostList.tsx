import PostItem from './PostItem';
import type { Post } from './PostItem';
import { useLanguage } from '@/app/_contexts/LanguageContext';

interface PostListProps {
  posts: Post[];
  onDelete: (id: string) => void;
  deletingId: string | null;
  onLikeToggle?: (postId: string, liked: boolean, likeCount: number) => void;
  onCommentAdded?: (postId: string, delta: number) => void;
}

function PostList({ posts, onDelete, deletingId, onLikeToggle, onCommentAdded }: PostListProps) {
  const { language } = useLanguage();
  const filteredPosts = posts.filter(post => post.language === language);

  return (
    <main>
      {filteredPosts.map(post => (
        <PostItem
          key={post.id}
          post={post}
          onDelete={onDelete}
          isDeleting={deletingId === post.id}
          onLikeToggle={onLikeToggle}
          onCommentAdded={onCommentAdded}
        />
      ))}
    </main>
  );
}

export default PostList;
