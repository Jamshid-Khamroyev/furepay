// src/pages/BlogEditorPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Check, ArrowLeft, Hash, Trash2, RefreshCw, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BlogEditor } from '../config/BlogEditor';

export default function BlogEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, setBlogs, updateBlog, blogs, deleteBlog } = useStore();

  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [deleting, setDeleting] = useState(false);
  
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    if (isEditMode && id) {
      const fetchExistingBlog = async () => {
        setLoading(true);
        try {
          const res = await api.get('/api/blog');
          const blogs = Array.isArray(res.data) ? res.data : res.data.blogs || [];
          const found = blogs.find((b: any) => b.id === id);
          if (found) {
            const authorId = typeof found.author === 'object' && found.author ? found.author.id : '';
            if (authorId !== user.id && user.role !== 'ADMIN') {
              navigate('/blogs');
              return;
            }
            setTitle(found.title);
            setContent(found.content || '');
            const tagNames = found.tags?.map((t: any) => typeof t === 'object' && t ? t.name : t) || [];
            setTags(tagNames);
          } else {
            navigate('/blogs');
          }
        } catch (e) {
          navigate('/blogs');
        } finally {
          setLoading(false);
        }
      };
      fetchExistingBlog();
    }
  }, [id, isEditMode, user, navigate]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      toast.warning('Tag already exists');
      return;
    }
    if (tags.length >= 10) {
      toast.warning('Maximum 10 tags allowed');
      return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
    tagInputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      handleRemoveTag(lastTag);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please fill in the title.');
      return;
    }

    if (!content || content === '{"type":"doc","content":[]}') {
      toast.error('Please add some content to your article.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        const { data } = await api.patch(`/api/blog/${id}`, { title, content, tags });
        updateBlog(id, data.blog);
        toast.success('Article updated successfully!');
        navigate(`/blogs/${encodeURIComponent(title)}`);
      } else {
        const response = await api.post('/api/blog', { title, content, tags });
        const created = response.data.blog;
        const dataForSave = [created, ...blogs]
        setBlogs(dataForSave);
        toast.success('Article published successfully!');
        navigate(`/blogs/${encodeURIComponent(created.slug)}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save the article. Please check your fields.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this article?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/blog/${id}`);
      deleteBlog(id);
      toast.success('Article deleted successfully!');
      navigate('/blogs');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete the article.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-5 w-5 animate-spin text-muted" />
        <p className="font-mono text-xs text-muted">Loading article editor...</p>
      </div>
    );
  }

  const busy = submitting || deleting;

  return (
    <form onSubmit={handleSubmit} className="min-h-dvh bg-bg animate-fade-in">
      {/* Editor top bar (global header is hidden on this route) */}
      <div className="sticky top-0 z-30 h-16 border-b border-line bg-bg/90 backdrop-blur">
        <div className="h-full px-4 md:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/blogs"
              className="-ml-2 inline-flex items-center gap-1.5 px-2 min-h-[44px] rounded-lg text-sm font-medium text-ink-2 hover:text-ink active:opacity-70 transition"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="max-sm:hidden">Back to Articles</span>
            </Link>
            <span className="h-5 w-px bg-line shrink-0" />
            <span className="font-mono text-xs text-muted truncate">
              {submitting ? 'Saving...' : deleting ? 'Deleting...' : isEditMode ? 'Editing' : 'New article'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                aria-label={deleting ? 'Deleting...' : 'Delete Post'}
                title="Delete Post"
                className="grid place-items-center h-[38px] w-[38px] max-md:h-11 max-md:w-11 rounded-lg border border-line-strong bg-surface text-danger hover:bg-danger-soft active:scale-[0.97] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 bg-ink text-bg font-semibold rounded-lg px-4 py-2.5 min-h-[44px] md:min-h-0 text-sm hover:opacity-90 active:scale-[0.97] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>
                {submitting ? 'Saving...' : isEditMode ? (
                  <>Update<span className="max-sm:hidden"> article</span></>
                ) : (
                  <>Publish<span className="max-sm:hidden"> article</span></>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      <BlogEditor
        content={content}
        onChange={handleContentChange}
        editable={!submitting && !deleting}
      >
        {/* Title */}
        <label htmlFor="title" className="sr-only">Title</label>
        <textarea
          id="title"
          rows={1}
          required
          disabled={busy}
          value={title}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))}
          onInput={(e) => {
            // Fallback auto-grow for browsers without field-sizing support
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            // Titles are a single line: Enter submits like the old input did
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Give your article a compelling title..."
          className="block w-full resize-none [field-sizing:content] overflow-hidden bg-transparent border-0 p-0 font-serif text-[32px] md:text-[48px] leading-[1.15] tracking-tight text-ink placeholder:text-muted focus:outline-none disabled:opacity-60"
        />

        {/* Tags */}
        <div className="mt-8 border-y border-line py-4">
          <div className="flex items-start gap-3">
            <Hash className="h-4 w-4 mt-2 shrink-0 text-muted" />
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 font-mono text-xs bg-surface-2 text-ink-2"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="grid place-items-center h-5 w-5 rounded-full text-muted hover:text-ink hover:bg-line cursor-pointer"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <label htmlFor="tags" className="sr-only">Tags</label>
              <input
                ref={tagInputRef}
                type="text"
                id="tags"
                disabled={busy}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                enterKeyHint="done"
                placeholder={tags.length >= 10 ? 'Max 10 tags reached' : 'Add a tag and press Enter'}
                className="flex-1 min-w-[160px] min-h-[36px] bg-transparent border-0 px-1 text-base md:text-sm text-ink placeholder:text-muted focus:outline-none disabled:opacity-60"
                maxLength={30}
              />
            </div>
            {tagInput.trim() && tags.length < 10 && (
              <button
                type="button"
                onClick={handleAddTag}
                disabled={busy}
                className="md:hidden shrink-0 grid place-items-center h-9 w-9 rounded-lg bg-surface-2 text-ink active:scale-[0.97]"
                aria-label="Add tag"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <span className="shrink-0 mt-2 font-mono text-xs text-muted">{tags.length} / 10</span>
          </div>
          <p className="mt-2 pl-7 font-mono text-[11px] text-muted">
            Enter to add · Backspace to remove last
            {tags.length >= 10 && <span className="ml-1 text-accent-ink">(Maximum 10 tags)</span>}
          </p>
        </div>
      </BlogEditor>
    </form>
  );
}
