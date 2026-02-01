'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './PostItem.css';
import DeleteButton from './DeleteButton';
import { useAuth } from '@/app/_contexts/AuthContext';
import { useLanguage } from '@/app/_contexts/LanguageContext';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  language: 'en' | 'cs';
  likeCount?: number;
  likedByMe?: boolean;
  commentCount?: number;
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
  onLikeToggle?: (postId: string, liked: boolean, likeCount: number) => void;
  onCommentAdded?: (postId: string) => void;
}

function PostItem({ post, onDelete, isDeleting = false, onLikeToggle, onCommentAdded }: PostProps) {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe ?? false);
  const [liking, setLiking] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsFetchedRef = useRef(false);

  const isLong = post.content.length > MAX_PREVIEW_LENGTH;
  const displayContent = isLong && !isExpanded
    ? `${post.content.slice(0, MAX_PREVIEW_LENGTH).trim()}…`
    : post.content;

  const paragraphs = displayContent.split(/\n\n+/).filter(Boolean);

  useEffect(() => {
    setLikeCount(post.likeCount ?? 0);
    setLikedByMe(post.likedByMe ?? false);
  }, [post.likeCount, post.likedByMe]);

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data);
    } finally {
      setCommentsLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (!commentsOpen) {
      commentsFetchedRef.current = false;
      return;
    }
    if (commentsFetchedRef.current) return;
    commentsFetchedRef.current = true;
    fetchComments();
  }, [commentsOpen, fetchComments]);

  const handleLike = async () => {
    if (!user || !token || liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return;
      if (!res.ok) return;
      const data = await res.json();
      setLikedByMe(data.liked);
      setLikeCount(data.likeCount);
      onLikeToggle?.(post.id, data.liked, data.likeCount);
    } finally {
      setLiking(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.status === 401 || !res.ok) return;
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      onCommentAdded?.(post.id);
    } finally {
      setSubmittingComment(false);
    }
  };

  function formatCommentDate(iso: string): string {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(language === 'cs' ? 'cs-CZ' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  }

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
      <div className="post-actions">
        {user && (
          <button
            type="button"
            className={`post-like-button ${likedByMe ? 'post-like-button--liked' : ''}`}
            onClick={handleLike}
            disabled={liking}
            aria-pressed={likedByMe}
            title={likedByMe ? 'Unlike' : 'Like'}
          >
            <span className="post-like-icon" aria-hidden>♥</span>
            <span>{likeCount}</span>
          </button>
        )}
        {!user && (post.likeCount ?? 0) > 0 && (
          <span className="post-like-count" aria-label={`${post.likeCount} likes`}>
            ♥ {post.likeCount}
          </span>
        )}
        <button
          type="button"
          className="post-comments-toggle"
          onClick={() => setCommentsOpen((prev) => !prev)}
        >
          {commentsOpen ? 'Hide comments' : `Comments (${post.commentCount ?? 0})`}
        </button>
      </div>
      {commentsOpen && (
        <div className="post-comments">
          {user && (
            <form className="post-comment-form" onSubmit={handleSubmitComment}>
              <label htmlFor={`comment-${post.id}`} className="visually-hidden">
                Add a comment
              </label>
              <textarea
                id={`comment-${post.id}`}
                className="post-comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
                disabled={submittingComment}
              />
              <button
                type="submit"
                className="post-comment-submit"
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? 'Posting…' : 'Comment'}
              </button>
            </form>
          )}
          {commentsLoading ? (
            <p className="post-comments-loading">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="post-comments-empty">No comments yet.</p>
          ) : (
            <ul className="post-comment-list">
              {comments.map((c) => (
                <li key={c.id} className="post-comment">
                  <span className="post-comment-author">{c.username}</span>
                  <span className="post-comment-date">{formatCommentDate(c.createdAt)}</span>
                  <p className="post-comment-text">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

export default PostItem;
