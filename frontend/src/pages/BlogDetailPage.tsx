// BlogDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Blog, Comment } from '../types';
import CommentSection from '../components/CommentSection';
import {
  Heart,
  ArrowLeft,
  Pencil,
  Trash2,
  LoaderIcon,
  MessageCircle,
} from 'lucide-react';
import { Avatar } from '../components/Navbar';
import { toast } from 'sonner';
import { renderTiptapContent } from '../utils/tiptap';
import { socket } from '../config/socket';

export default function BlogDetailPage() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const { user, deleteBlog, updateBlog } = useStore();

  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBlogDetails = async () => {
    if (!title) return;
    setLoading(true);
    try {
      const blogRes = await api.get(`/api/blog/${encodeURIComponent(title)}`);
      const blogData = blogRes.data;
      setCurrentBlog(blogData.blog);
      
      if (blogData && blogData.blog && blogData.blog.id) {
        const commentsRes = await api.get(`/api/blog/${blogData.blog.id}/comments`);
        setComments(commentsRes.data.comments || []);
      }
    } catch (e) {
      setCurrentBlog(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogDetails();
  }, [title]);

  useEffect(() => {
    socket.on('blog:updated', (data: Blog) => {
      updateBlog(data.id, data)
      setCurrentBlog(data)
    })
    
    socket.on('blog:comment:add', (comment: Comment) => {
      if(comment.author.id === user.id) return
      setComments(prev => [comment, ...prev])
    })

    socket.on('blog:comment:delete', (comment: Comment) => {
      setComments(prev => prev.filter(c => c.id !== comment.id))
    })

    socket.on('blog:comment:update', (comment: Comment) => {
      setComments(prev => prev.map(c => {
        if(c.id === comment.id){
          return comment
        }

        return c
      }))
    })

    socket.on("blog:like", (data: { like: { userId: string }; blogId: string }) => {
      if(data.like.userId === user.id) return
      setCurrentBlog(b =>
          b.id === data.blogId
            ? {
                ...b,
                likes: b.likes.some(l => l.userId === data.like.userId)
                  ? b.likes
                  : [...b.likes, data.like],
              }
            : b
        )
      console.log("add like");
    });
  
    socket.on("blog:unlike", (data: { like: { userId: string }; blogId: string }) => {
      if(data.like.userId === user.id) return
      setCurrentBlog(b =>
          b.id === data.blogId
            ? {
                ...b,
                likes: b.likes.filter(l => l.userId !== data.like.userId),
              }
            : b
        )

      console.log("remove like");
    });

    socket.on('blog:deleted', (id: string) => {
      deleteBlog(id)
      setCurrentBlog(null)
    })
  },[socket])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <LoaderIcon className="h-5 w-5 animate-spin text-muted" />
        <p className="font-mono text-xs text-muted">Loading article details...</p>
      </div>
    );
  }

  if (!currentBlog) {
    return (
      <div className="max-w-[720px] mx-auto px-5 md:px-0 py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">404</p>
        <h2 className="mt-3 font-serif text-[32px] md:text-[40px] leading-[1.1] tracking-tight text-ink">Article not found</h2>
        <p className="mt-3 text-ink-2">The article you are trying to read might have been removed or renamed.</p>
        <Link
          to="/blogs"
          className="mt-8 inline-flex items-center gap-2 bg-ink text-bg font-semibold rounded-lg px-4 py-2.5 text-sm hover:opacity-90 active:scale-[0.97] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Blogs</span>
        </Link>
      </div>
    );
  }

  const authorName = typeof currentBlog.author === 'object' && currentBlog.author 
    ? currentBlog.author.username 
    : 'Anonymous';
  const authorId = typeof currentBlog.author === 'object' && currentBlog.author 
    ? currentBlog.author.id 
    : '';
  const canEdit = user && user.id === authorId && user.role !== 'ADMIN';
  const canDelete = user && (user.id === authorId || user.role === 'ADMIN');
  const isLiked =
  !!user &&
  currentBlog.likes.some((like) => like.userId === user.id);

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      if (isLiked) {
        await api.delete(`/api/blog/${currentBlog.id}/like`);
        setCurrentBlog(prev => {
          if (!prev) return null;
          return {
            ...prev,
            likes: prev.likes.filter(like => like.userId !== user.id),
          };
        });
        toast.success('Removed like');
      } else {
        const { data } = await api.post(`/api/blog/${currentBlog.id}/like`);
        setCurrentBlog(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            likes: [...prev.likes, data.like],
          };
        });
        toast.success('Liked article');
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to update like';
      toast.error(msg);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/api/blog/${currentBlog.id}`);
      deleteBlog(data.blog.id);
      toast.success('Article deleted successfully');
      navigate('/blogs');
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to delete article';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = currentBlog.createdAt
    ? new Date(currentBlog.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown Date';

  // Contentni render qilish
  const renderContent = () => {
    if (!currentBlog.content) return null;

    // Agar content string bo'lsa, uni JSON ga parse qilish
    let contentData = currentBlog.content;
    if (typeof contentData === 'string') {
      try {
        contentData = JSON.parse(contentData);
      } catch {
        // Agar JSON emas bo'lsa, oddiy matn sifatida ko'rsatish
        return <p className="prose">{contentData}</p>;
      }
    }

    const htmlContent = renderTiptapContent(contentData);
    return <div className="prose break-words" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  const likesCount = currentBlog.likes?.length || 0;
  const commentsCount = comments?.length || 0;

  const scrollToComments = () => {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const likePill = (extra = '') => (
    <button
      onClick={handleLike}
      disabled={!user || liking}
      aria-label={isLiked ? 'Unlike' : 'Like'}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition active:scale-[0.97] disabled:cursor-not-allowed ${
        !user ? 'bg-surface-2 text-muted' : isLiked ? 'bg-accent-soft text-accent-ink cursor-pointer' : 'bg-surface-2 text-ink-2 hover:text-ink cursor-pointer'
      } ${extra}`}
    >
      {liking ? (
        <LoaderIcon className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-accent' : ''}`} />
      )}
      <span className="font-mono text-xs">
        {likesCount}
        {isLiked ? ' · Liked' : ''}
      </span>
    </button>
  );

  return (
    <div className="max-w-[720px] mx-auto px-5 md:px-0 pt-6 md:pt-8 pb-24 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/blogs"
          className="-ml-2 inline-flex items-center gap-1.5 px-2 min-h-[44px] md:min-h-0 md:py-1.5 rounded-lg text-sm font-medium text-ink-2 hover:text-ink active:opacity-70 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Blogs</span>
        </Link>

        {(canEdit || canDelete) && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                to={`/blogs/edit/${currentBlog.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-line-strong text-ink text-sm font-medium px-3 py-2 min-h-[40px] md:min-h-0 hover:bg-surface-2 active:scale-[0.97] transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Link>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-danger-soft text-danger text-sm font-medium px-3 py-2 min-h-[40px] md:min-h-0 hover:opacity-90 active:scale-[0.97] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <article className="mt-8 md:mt-12">
        {/* Tags */}
        {currentBlog.tags && currentBlog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {currentBlog.tags.map((tag) => (
              <span
                key={tag.name}
                className="rounded-full px-2.5 py-1 font-mono text-xs bg-surface-2 text-ink-2"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="mt-5 font-serif text-[32px] md:text-[52px] leading-[1.08] tracking-tight text-ink">
          {currentBlog.title}
        </h1>

        {/* Byline */}
        <div className="mt-7 flex items-center justify-between gap-4 border-y border-line py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/profile/${currentBlog.author.id}`} className="shrink-0">
              <Avatar name={authorName} src={currentBlog.author?.avatar || undefined} size={40} />
            </Link>
            <div className="min-w-0">
              <Link
                to={`/profile/${currentBlog.author.id}`}
                className="block truncate text-sm font-semibold text-ink hover:underline underline-offset-2"
              >
                @{authorName}
              </Link>
              <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-muted">Published {formattedDate}</p>
            </div>
          </div>
          <div className="hidden md:block shrink-0">{likePill('')}</div>
        </div>

        {/* Content */}
        <div className="mt-10">
          {renderContent()}
        </div>
      </article>

      {/* Comments section */}
      <CommentSection blog={currentBlog} comments={comments} setComments={setComments} />

      {/* Phone bottom action bar */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-surface border-t border-line pb-safe">
        <div className="h-16 px-4 flex items-center gap-3">
          {likePill('shrink-0 min-h-[44px]')}
          <button
            onClick={scrollToComments}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-full border border-line-strong px-4 min-h-[44px] text-sm text-ink-2 active:scale-[0.97] transition cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">
              <span className="font-mono text-xs">{commentsCount} comments</span>
              <span className="hidden min-[420px]:inline"> · Join the discussion</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
