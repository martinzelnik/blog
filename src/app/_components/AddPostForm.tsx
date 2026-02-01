import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AddPostForm.css';
import type { Post } from './PostItem';
import { LoadingButton } from './LoadingButton';
import { useAuth } from '@/app/_contexts/AuthContext';
import { useLanguage } from '@/app/_contexts/LanguageContext';

interface AddPostFormProps {
  onAddPost: (data: Omit<Post, 'id'>) => Promise<void>;
  isPosting?: boolean;
  onSuccess?: () => void;
}

function AddPostForm({ onAddPost, isPosting = false, onSuccess }: AddPostFormProps) {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [postLanguage, setPostLanguage] = useState<'en' | 'cs'>(language);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPostLanguage(language);
  }, [language]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAiError(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
  };

  const handleGenerateWithAi = async () => {
    if (!image) return;
    setAiError(null);
    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post<{ title: string; content: string }>(
        '/api/ai/generate-post',
        { image, language: postLanguage },
        { headers }
      );
      const data = res.data;
      setTitle(data.title ?? '');
      setContent(data.content ?? '');
    } catch (e) {
      setAiError(
        axios.isAxiosError(e)
          ? (e.response?.data as { error?: string })?.error ?? 'Failed to generate content'
          : 'Failed to generate content'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await onAddPost({
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString().split('T')[0],
        image: image || undefined,
        language: postLanguage,
      });
      setTitle('');
      setContent('');
      setImage(null);
      setAiError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
    } catch {
      // Error is handled by parent
    }
  };

  return (
    <section className="add-post">
      <h2>Add New Post</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="content">Content:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="add-post__language">
          <label htmlFor="post-language">Post language:</label>
          <select
            id="post-language"
            value={postLanguage}
            onChange={(e) => setPostLanguage(e.target.value as 'en' | 'cs')}
            aria-label="Post language"
          >
            <option value="en">English 🇬🇧</option>
            <option value="cs">Czech 🇨🇿</option>
          </select>
        </div>
        <div>
          <label htmlFor="image">Image (optional):</label>
          <input
            type="file"
            id="image"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            onChange={handleImageChange}
            ref={fileInputRef}
          />
          {image && (
            <div className="add-post__image-actions">
              <p className="image-preview-text">Image selected ✓</p>
              <LoadingButton
                type="button"
                className="add-post__generate-ai"
                onClick={handleGenerateWithAi}
                loading={isGenerating}
                loadingText="Generating…"
                disabled={isPosting}
              >
                Generate with AI
              </LoadingButton>
            </div>
          )}
          {aiError && <p className="add-post__ai-error">{aiError}</p>}
        </div>
        <button type="submit" disabled={isPosting} className="add-post__submit">
          {isPosting ? (
            <>
              <span className="add-post__spinner" aria-hidden />
              Posting…
            </>
          ) : (
            'Add Post'
          )}
        </button>
      </form>
    </section>
  );
}

export default AddPostForm;
