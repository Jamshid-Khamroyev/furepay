import React, { useState, useMemo, useCallback, SetStateAction, Dispatch } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Blog } from '../types';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Heart, ArrowUpRight, MessageCircle, LoaderIcon, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from './Navbar';
import { toast } from 'sonner';

const getAuthorName = (blog: Blog): string => {
  return typeof blog.author === 'object' && blog.author ? blog.author.username : 'Anonymous';
};

const getAuthorAvatar = (blog: Blog): string | null => {
  return typeof blog.author === 'object' && blog.author ? blog.author.avatar : null;
};

const getLikesCount = (blog: Blog): number => {
  return blog.likes?.length ?? 0;
};

const getCommentsCount = (blog: Blog): number => {
  return blog._count?.comments ?? 0;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown Date';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDateParts = (dateStr?: string): { monthDay: string; year: string } => {
  if (!dateStr) return { monthDay: '—', year: '' };
  const d = new Date(dateStr);
  return {
    monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
    year: String(d.getFullYear()),
  };
};

const formatShortDate = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown Date';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Plain-text preview from TipTap JSON (or raw string) content
const getExcerpt = (content?: string, max = 280): string => {
  if (!content) return '';
  const collect = (node: any): string => {
    if (!node) return '';
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.content)) {
      const sep = node.type === 'paragraph' || node.type === 'heading' ? '' : ' ';
      return node.content.map(collect).join(sep);
    }
    return '';
  };
  let text = '';
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    text = typeof parsed === 'object' ? collect(parsed) : String(parsed);
  } catch {
    text = String(content).replace(/<[^>]*>/g, ' ');
  }
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

const isUserLiked = (blog: Blog, userId?: string): boolean => {
  if (!userId) return false;
  return blog.likes.some(like => like.userId === userId);
};

interface BlogCardProps {
  blog: Blog;
  setBlogs: Dispatch<SetStateAction<Blog[]>>
  onLikeToggle?: (blogId: string, isLiked: boolean) => void;
}

export default function BlogCard({ blog, onLikeToggle, setBlogs }: BlogCardProps) {
  const { user, deleteBlog } = useStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const authorName = getAuthorName(blog);
  const authorAvatar = getAuthorAvatar(blog);
  const formattedDate = formatDate(blog.createdAt);
  const formattedShortDate = formatShortDate(blog.createdAt);
  const dateParts = getDateParts(blog.createdAt);
  const excerpt = useMemo(() => getExcerpt(blog.content), [blog.content]);
  const likesCount = getLikesCount(blog);
  const commentsCount = getCommentsCount(blog);
  const isLiked = isUserLiked(blog, user?.id);
  const navigate = useNavigate()

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.info('Please login to like posts');
      return;
    }
    
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (isLiked) {
        await api.delete(`/api/blog/${blog.id}/like`);
      } else {
        await api.post(`/api/blog/${blog.id}/like`);
      }

      onLikeToggle?.(blog.id, isLiked);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update like status';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/api/blog/${blog.id}`);
      if(data.success){
        setBlogs(prev => prev.filter(b => b.id !== blog.id ))
        deleteBlog(blog.id)
      }
      toast.success('Article deleted successfully');
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to delete article';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Yangi holat: foydalanuvchi o'z blogini tahrirlashi yoki o'chirishi mumkin
  const isOwner = user?.id === blog.author.id;

  const goToAuthor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${blog.author.id}`);
  };

  return (
    <Link
      to={`/blogs/${encodeURIComponent(blog.slug)}`}
      className="group flex gap-8 py-7 border-b border-line active:opacity-80 transition-opacity"
    >
      {/* Date column */}
      <div className="hidden md:block w-24 shrink-0 pt-1 font-mono" title={formattedDate}>
        <p className="text-xs uppercase tracking-[0.08em] text-ink-2">{dateParts.monthDay}</p>
        <p className="mt-1 text-xs text-muted">{dateParts.year}</p>
      </div>

      <div className="flex-1 min-w-0">
        {/* Author line */}
        <div className="flex items-center gap-2 text-[13px] text-ink-2">
          <span onClick={goToAuthor} className="cursor-pointer">
            <Avatar name={authorName} src={authorAvatar || undefined} size={22} />
          </span>
          <span onClick={goToAuthor} className="cursor-pointer hover:text-ink hover:underline underline-offset-2 truncate">
            @{authorName}
          </span>
          <span className="md:hidden font-mono text-xs text-muted shrink-0">· {formattedShortDate}</span>
        </div>

        {/* Title */}
        <h3 className="mt-2.5 font-serif text-[21px] md:text-[28px] font-medium tracking-tight leading-tight text-ink group-hover:text-accent-ink transition-colors">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2 line-clamp-3">{excerpt}</p>
        )}

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {blog.tags && blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.name}
                className="rounded-full px-2.5 py-1 font-mono text-xs bg-surface-2 text-ink-2"
              >
                #{tag.name}
              </span>
            ))}
            {blog.tags && blog.tags.length > 3 && (
              <span className="font-mono text-xs text-muted">+{blog.tags.length - 3}</span>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-3 text-ink-2 -mr-2 md:mr-0">
            <button
              onClick={handleLike}
              disabled={!user || loading}
              className={`inline-flex items-center gap-1.5 px-2 min-h-[44px] md:min-h-0 md:py-1 rounded-md transition-colors disabled:opacity-60 active:scale-[0.97] ${
                loading ? 'cursor-wait' : 'cursor-pointer'
              } ${isLiked ? 'text-accent' : 'hover:text-ink'}`}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              {loading ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              )}
              <span className="font-mono text-xs">{likesCount || 0}</span>
            </button>

            <span className="inline-flex items-center gap-1.5 px-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-mono text-xs">{commentsCount}</span>
            </span>

            {isOwner && (
              <>
                <span
                  role="link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/blogs/edit/${blog.id}`);
                  }}
                  className="inline-flex items-center gap-1 px-2 min-h-[44px] md:min-h-0 md:py-1 rounded-md text-sm text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer active:opacity-70"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="max-sm:hidden">Edit</span>
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1 px-2 min-h-[44px] md:min-h-0 md:py-1 rounded-md text-sm text-danger hover:bg-danger-soft cursor-pointer disabled:opacity-50 active:opacity-70"
                  aria-label="Delete"
                >
                  {deleting ? <LoaderIcon className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span className="max-sm:hidden">Delete</span>
                </button>
              </>
            )}

            <span className="hidden sm:inline-flex items-center gap-1 pl-1 text-sm font-medium text-ink group-hover:text-accent-ink transition-colors">
              Read
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
