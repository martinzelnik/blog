import { useState, useRef, useEffect } from 'react';
import './AddPostForm.css';
import type { Post } from './PostItem';
import { useLanguage } from '@/app/_contexts/LanguageContext';

interface AddPostFormProps {
  onAddPost: (data: Omit<Post, 'id'>) => void;
  isPosting?: boolean;
  onSuccess?: () => void;
}

function AddPostForm({ onAddPost, isPosting = false, onSuccess }: AddPostFormProps) {
  const { language } = useLanguage();
  const [postLanguage, setPostLanguage] = useState<'en' | 'cs'>(language);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPostLanguage(language);
  }, [language]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onAddPost({
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString().split('T')[0],
        image: image || undefined,
        language: postLanguage,
      });
      setTitle('');
      setContent('');
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
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
            accept="image/jpeg,.jpg,.jpeg"
            onChange={handleImageChange}
            ref={fileInputRef}
          />
          {image && <p className="image-preview-text">Image selected ✓</p>}
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
