import React, { useState, useMemo, useCallback, SetStateAction, Dispatch } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Blog } from '../types';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Heart, Calendar, Tag, ArrowRight, User, MessageCircle, Loader2, LoaderIcon, Edit2 } from 'lucide-react';
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

  return (
    <Link
      to={`/blogs/${encodeURIComponent(blog.slug)}`}
      className="block group"
    >
      <div className="bg-[#fffefb] border border-amber-200/60 rounded-xl overflow-hidden hover:border-amber-400 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Image area - Title as image */}
        <div className="relative w-full h-48 bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100/50 flex items-center justify-center p-6 overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400 rounded-full blur-3xl" />
          </div>
          
          {/* Title as image */}
          <div className="relative z-10 text-center">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 leading-tight line-clamp-3 group-hover:text-amber-700 transition-colors">
              {blog.title.slice(0, 18)}...
            </h3>
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {blog.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-serif font-medium bg-amber-50/80 text-amber-800 border border-amber-100 backdrop-blur-sm"
                  >
                    <Tag className="h-2.5 w-2.5 shrink-0 text-amber-600" />
                    <span>{tag.name}</span>
                  </span>
                ))}
                {blog.tags.length > 3 && (
                  <span className="text-[10px] text-neutral-400 font-serif">+{blog.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Author & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div onClick={() => navigate(`/profile/${blog.author.id}`)} className='cursor-pointer'>
                {authorAvatar ? (
                  <img 
                    src={authorAvatar} 
                    alt={authorName}
                    className="w-8 h-8 rounded-full object-cover border border-amber-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <div onClick={() => navigate(`/profile/${blog.author.id}`)} className='cursor-pointer hover:underline'>
                  <span className="text-xs font-serif font-medium text-amber-900">
                    @{authorName}
                  </span>
                </div>

                <span className="text-[10px] text-neutral-400 font-serif flex items-center space-x-1">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{formattedDate}</span>
                </span>
              </div>
            </div>

            {/* Actions - Edit & Delete buttons for owner */}
            {isOwner && (
              <div className="flex items-center space-x-1">
                <Link
                  to={`/blogs/edit/${blog.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-amber-200 rounded-full text-[10px] font-serif font-medium text-neutral-700 bg-white hover:bg-amber-50 transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                  <span className="max-sm:hidden">Edit</span>
                </Link>
                
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 border border-red-200 rounded-full text-[10px] font-serif font-medium text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <LoaderIcon className="h-3 w-3 animate-spin" />
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            )}

            {/* Stats for non-owner */}
            {!isOwner && (
              <div className="flex items-center space-x-2">
                {/* Comments */}
                <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-medium text-blue-600 bg-blue-50/60 border border-blue-100">
                  <MessageCircle className="h-3 w-3 text-blue-500" />
                  <span className="font-semibold">{commentsCount}</span>
                </div>

                {/* Like */}
                <button
                  onClick={handleLike}
                  disabled={!user || loading}
                  className={`inline-flex items-center space-x-1 px-2 py-1 text-[10px] font-medium transition-colors duration-200 disabled:opacity-50 rounded-full ${
                    loading
                      ? 'cursor-wait'
                      : isLiked
                      ? 'text-red-600 bg-red-50/60 border border-red-100'
                      : 'text-neutral-500 hover:text-red-600 hover:bg-red-50/30'
                  }`}
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                  {!loading && <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-red-600' : ''}`} />}
                  <span>{loading ? <LoaderIcon className='w-4 h-4 animate-spin' /> :  likesCount || 0}</span>
                </button>

                {/* Read Full */}
                <div className="inline-flex items-center space-x-1 text-[10px] font-serif font-semibold text-amber-900 group-hover:text-amber-700 transition-colors">
                  <span className="max-md:hidden">Read</span>
                  <ArrowRight className="h-3 w-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}