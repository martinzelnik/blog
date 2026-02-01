'use client';

import { useState, useEffect, useCallback } from 'react';
import PostList from '@/app/_components/PostList';
import AddPostForm from '@/app/_components/AddPostForm';
import Modal from '@/app/_components/Modal';
import { useAuth } from '@/app/_contexts/AuthContext';
import type { Post } from '@/app/_components/PostItem';

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts');
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
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
      const data = await fetchPosts();
      setPosts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const addPost = async (data: Omit<Post, 'id'>) => {
    setPosting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        logout();
        setError('Session expired. Please log in again.');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create post');
      }
      const newPost: Post = await res.json();
      setPosts((prev) => [newPost, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add post');
    } finally {
      setPosting(false);
    }
  };

  const deletePost = async (id: string) => {
    setDeletingId(id);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.status === 401) {
        logout();
        setError('Session expired. Please log in again.');
        return;
      }
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  return (
      <>
        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        {user && (
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
          <PostList posts={posts} onDelete={deletePost} deletingId={deletingId} />
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
