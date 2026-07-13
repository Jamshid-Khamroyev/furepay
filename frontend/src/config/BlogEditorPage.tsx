import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Save, ArrowLeft, Tag, Trash2, RefreshCw, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BlogEditor } from '../config/BlogEditor';

export default function BlogEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useStore();

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

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please fill in the title.');
      return;
    }

    try {
      const parsedContent = JSON.parse(content);
      if (!parsedContent.content || parsedContent.content.length === 0 || 
          (parsedContent.content.length === 1 && parsedContent.content[0].type === 'paragraph' && 
           parsedContent.content[0].content?.length === 0)) {
        toast.error('Please add some content to your article.');
        return;
      }
    } catch {
      if (!content.trim()) {
        toast.error('Please add some content to your article.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        await api.patch(`/api/blog/${id}`, { title, content, tags });
        toast.success('Article updated successfully!');
        navigate(`/blogs/${encodeURIComponent(title)}`);
      } else {
        const response = await api.post('/api/blog', { title, content, tags });
        const created = response.data.blog || response.data;
        toast.success('Article published successfully!');
        navigate(`/blogs/${encodeURIComponent(created.title || title)}`);
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
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-neutral-500 font-mono">Loading article editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          to="/blogs"
          className="inline-flex items-center space-x-1.5 text-sm font-serif font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Articles</span>
        </Link>

        {isEditMode && (
          <button
            onClick={handleDelete}
            disabled={deleting || submitting}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            <span>{deleting ? 'Deleting...' : 'Delete Post'}</span>
          </button>
        )}
      </div>

      <div className="bg-[#fffefb] border border-amber-200/60 rounded-xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-amber-950 mb-6">
          {isEditMode ? 'Edit Article' : 'Write a New Article'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-serif font-medium text-amber-900">
              Title
            </label>
            <input
              type="text"
              id="title"
              required
              disabled={submitting || deleting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your article a compelling title..."
              className="mt-1 block w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900 disabled:opacity-60 disabled:bg-neutral-50 transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-serif font-medium text-amber-900">
              Tags
            </label>
            <div className="mt-1">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-serif font-medium text-amber-800"
                    >
                      <Tag className="h-3.5 w-3.5 text-amber-600" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="p-0.5 hover:bg-amber-200 rounded-full transition-colors cursor-pointer"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3.5 w-3.5 text-amber-600" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-amber-700" />
                  </div>
                  <input
                    ref={tagInputRef}
                    type="text"
                    id="tags"
                    disabled={submitting || deleting}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length >= 10 ? "Max 10 tags reached" : "Type tag and press Enter..."}
                    className="block w-full pl-9 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900 disabled:opacity-60 disabled:bg-neutral-50 transition-all duration-200"
                    maxLength={30}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || tags.length >= 10 || submitting || deleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900 text-white rounded-lg text-sm font-serif font-medium hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>
              
              <p className="mt-1.5 text-xs text-neutral-500 font-serif">
                Press <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-mono">Enter</kbd> to add tag,{' '}
                <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-mono">Backspace</kbd> to remove last tag
                {tags.length >= 10 && (
                  <span className="text-amber-600 ml-1">(Maximum 10 tags)</span>
                )}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-serif font-medium text-amber-900">
              Content
            </label>
            <BlogEditor 
              content={content} 
              onChange={handleContentChange}
              editable={!submitting && !deleting}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || deleting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-amber-900 text-white rounded-lg font-serif font-semibold text-sm hover:bg-amber-800 transition-colors cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{submitting ? 'Saving...' : isEditMode ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}