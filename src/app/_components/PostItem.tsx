'use client';

import { useState } from 'react';
import './PostItem.css';
import DeleteButton from './DeleteButton';
import { useAuth } from '@/app/_contexts/AuthContext';
import { useLanguage } from '@/app/_contexts/LanguageContext';

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  language: 'en' | 'cs';
}

const MAX_PREVIEW_LENGTH = 1000;

function formatDate(dateStr: string, locale: 'en' | 'cs'): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat(locale === 'cs' ? 'cs-CZ' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

interface PostProps {
  post: Post;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function PostItem({ post, onDelete, isDeleting = false }: PostProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong = post.content.length > MAX_PREVIEW_LENGTH;
  const displayContent = isLong && !isExpanded
    ? `${post.content.slice(0, MAX_PREVIEW_LENGTH).trim()}…`
    : post.content;

  const paragraphs = displayContent.split(/\n\n+/).filter(Boolean);

  return (
    <article className="post">
      {user?.role === 'admin' && (
        <DeleteButton
          onDelete={() => onDelete(post.id)}
          loading={isDeleting}
        />
      )}
      <h2>{post.title}</h2>
      <p className="date">{formatDate(post.date, language)}</p>
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
