'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PostList from '@/app/_components/PostList';
import AddPostForm from '@/app/_components/AddPostForm';
import Modal from '@/app/_components/Modal';
import { useAuth } from '@/app/_contexts/AuthContext';
import type { Post } from '@/app/_components/PostItem';

async function fetchPosts(token: string | null): Promise<Post[]> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await axios.get<Post[]>('/api/posts', { headers });
  return res.data;
}

export default function HomePage() {
  const { user, token, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPosts(token);
      setPosts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const addPost = async (data: Omit<Post, 'id'>) => {
    const tempId = `pending-${Date.now()}`;
    const optimisticPost: Post = {
      id: tempId,
      ...data,
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    };
    setPosts((prev) => [optimisticPost, ...prev]);
    setError(null);
    setPosting(true);
    (async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const res = await axios.post<Post>('/api/posts', data, { headers });
        const newPost = res.data;
        setPosts((prev) =>
          prev.map((p) => (p.id === tempId ? newPost : p))
        );
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          logout();
          setError('Session expired. Please log in again.');
        } else {
          setError(
            axios.isAxiosError(e)
              ? (e.response?.data as { error?: string })?.error ?? 'Failed to create post'
              : e instanceof Error
                ? e.message
                : 'Failed to create post'
          );
        }
        setPosts((prev) => prev.filter((p) => p.id !== tempId));
      } finally {
        setPosting(false);
      }
    })();
  };

  const deletePost = async (id: string) => {
    setDeletingId(id);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      await axios.delete(`/api/posts/${id}`, { headers });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        logout();
        setError('Session expired. Please log in again.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to delete post');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleLikeToggle = (postId: string, liked: boolean, likeCount: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likedByMe: liked, likeCount } : p
      )
    );
  };

  const handleCommentAdded = (postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentCount: (p.commentCount ?? 0) + delta }
          : p
      )
    );
  };

  return (
      <>
        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        {user?.role === 'admin' && (
          <button 
            className="add-post-button" 
            onClick={() => setIsModalOpen(true)}
          >
            Add New Post
          </button>
        )}
        {loading ? (
          <div className="loading-spinner" role="status" aria-live="polite">
            <div className="loading-spinner__ring" aria-hidden />
            <p className="loading-spinner__text">Loading posts…</p>
          </div>
        ) : (
          <PostList
            posts={posts}
            onDelete={deletePost}
            deletingId={deletingId}
            onLikeToggle={handleLikeToggle}
            onCommentAdded={handleCommentAdded}
          />
        )}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Add New Post"
        >
          <AddPostForm 
            onAddPost={addPost} 
            isPosting={posting}
            onSuccess={() => setIsModalOpen(false)}
          />
        </Modal>
      </>
  );
}
