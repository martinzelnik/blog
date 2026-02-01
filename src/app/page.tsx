'use client';

import { useState, useEffect, useCallback } from 'react';
import PostList from '@/app/_components/PostList';
import AddPostForm from '@/app/_components/AddPostForm';
import LoginForm from '@/app/_components/LoginForm';
import LanguageToggle from '@/app/_components/LanguageToggle';
import Modal from '@/app/_components/Modal';
import { LanguageProvider } from '@/app/_contexts/LanguageContext';
import type { Post } from '@/app/_components/PostItem';

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts');
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

interface User {
  id: string;
  username: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
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
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setUser({ id: data.id, username: data.username });
      setIsLoginModalOpen(false);
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <LanguageProvider>
      <div className="app-wrapper">
        <header className="page-header">
          <button 
            className="login-button" 
            onClick={user ? handleLogout : () => setIsLoginModalOpen(true)}
          >
            {user ? 'Log Out' : 'Log In'}
          </button>
          <h1>My Simple Blog</h1>
          <LanguageToggle />
        </header>
        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        <button 
          className="add-post-button" 
          onClick={() => setIsModalOpen(true)}
        >
          Add New Post
        </button>
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
        <Modal
          isOpen={isLoginModalOpen}
          onClose={() => {
            setIsLoginModalOpen(false);
            setLoginError(null);
          }}
          title="Log In"
        >
          <LoginForm
            onSubmit={handleLogin}
            isLoading={loginLoading}
            error={loginError}
          />
        </Modal>
      </div>
    </LanguageProvider>
  );
}
