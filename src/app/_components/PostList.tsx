import PostItem from './PostItem';
import type { Post } from './PostItem';
import { useLanguage } from '@/app/_contexts/LanguageContext';

interface PostListProps {
  posts: Post[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}

function PostList({ posts, onDelete, deletingId }: PostListProps) {
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
        />
      ))}
    </main>
  );
}

export default PostList;
