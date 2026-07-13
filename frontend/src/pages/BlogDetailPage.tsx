// BlogDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Blog, Comment } from '../types';
import CommentSection from '../components/CommentSection';
import {
  Calendar,
  Heart,
  ArrowLeft,
  Edit2,
  Trash2,
  User as UserIcon,
  Tag,
  LoaderIcon,
} from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LoaderIcon className="h-4 w-4 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-neutral-500 font-mono">Loading article details...</p>
      </div>
    );
  }

  if (!currentBlog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-800 font-serif">Article not found</h2>
        <p className="text-neutral-550 font-serif">The article you are trying to read might have been removed or renamed.</p>
        <Link
          to="/blogs"
          className="inline-flex items-center space-x-1 px-4 py-2 bg-amber-900 text-white rounded font-medium text-sm hover:bg-amber-800"
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
        month: 'long',
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
        return <p>{contentData}</p>;
      }
    }

    const htmlContent = renderTiptapContent(contentData);
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Back button */}
      <Link
        to="/blogs"
        className="inline-flex items-center space-x-1.5 text-sm font-serif font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Articles</span>
      </Link>

      {/* Main article */}
      <article className="bg-[#fffefb] border border-amber-200 md:rounded-xl p-3 sm:p-10 shadow-sm">
        {/* Title */}
        <h1 className="text-xl sm:text-4xl font-serif font-bold tracking-tight text-amber-950 leading-tight mb-6">
          {currentBlog.title}
        </h1>

        {/* Content - yangilangan qism */}
        <div className="text-neutral-800 space-y-5 leading-relaxed font-serif text-base sm:text-lg max-md:text-sm mb-8 prose prose-amber max-w-none">
          {renderContent()}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-400 pt-6">
          {/* Tags */}
          {currentBlog.tags && currentBlog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {currentBlog.tags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-serif font-medium"
                >
                  <Tag className="h-3 w-3 text-amber-600" />
                  <span>#{tag.name}</span>
                </span>
              ))}
            </div>
          )}

          {/* Author & Meta info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-gray-300">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <Link to={`/profile/${currentBlog.author.id}`} className='cursor-pointer'>
                {currentBlog.author?.avatar ? (
                  <img 
                    src={currentBlog.author.avatar} 
                    alt={authorName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-gray-300">
                    <UserIcon className="h-5 w-5 text-amber-600" />
                  </div>
                )}
              </Link>
              
              <div>
                <Link to={`/profile/${currentBlog.author.id}`}>
                  <p className="text-sm font-serif font-medium text-amber-900 hover:underline cursor-pointer">@{authorName}</p>
                </Link>
                <p className="text-xs text-neutral-500 font-serif flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formattedDate}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Like button */}
              <button
                onClick={handleLike}
                disabled={!user || liking}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  !user
                    ? 'text-neutral-400 bg-neutral-50 cursor-not-allowed'
                    : isLiked
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                {!liking && <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-red-600' : ''}`} />}
                <span>{liking ? <LoaderIcon className='w-4 h-4 animate-spin' /> : currentBlog.likes?.length || 0}</span>
              </button>

              {/* Edit/Delete buttons for author or admin */}
              {(canEdit || canDelete) && (
                <div className="flex items-center space-x-2">
                  {canEdit && (
                    <Link
                      to={`/blogs/edit/${currentBlog.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 border border-amber-200 rounded-full text-xs font-serif font-medium text-neutral-700 bg-white hover:bg-amber-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 border border-red-200 rounded-full text-xs font-serif font-medium text-red-600 bg-white hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Comments section */}
      <CommentSection blog={currentBlog} comments={comments} setComments={setComments} />
    </div>
  );
}