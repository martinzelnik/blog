'use client';

import { useState } from 'react';
import './PostItem.css';
import DeleteButton from './DeleteButton';
import { useAuth } from '@/app/_contexts/AuthContext';

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  language: 'en' | 'cs';
}

const MAX_PREVIEW_LENGTH = 1000;

interface PostProps {
  post: Post;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function PostItem({ post, onDelete, isDeleting = false }: PostProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong = post.content.length > MAX_PREVIEW_LENGTH;
  const displayContent = isLong && !isExpanded
    ? `${post.content.slice(0, MAX_PREVIEW_LENGTH).trim()}…`
    : post.content;

  const paragraphs = displayContent.split(/\n\n+/).filter(Boolean);

  return (
    <article className="post">
      {user && (
        <DeleteButton
          onDelete={() => onDelete(post.id)}
          loading={isDeleting}
        />
      )}
      <h2>{post.title}</h2>
      <p className="date">{post.date}</p>
      <div className="post-content-wrapper">
        {post.image && <img src={post.image} alt={post.title} className="post-image" />}
        <div className="post-text">
          {paragraphs.map((para, i) => (
            <p key={i}>{para.split('\n').map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}</p>
          ))}
        </div>
        {isLong && (
          <button
            type="button"
            className="post-expand-button"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </article>
  );
}

export default PostItem;
