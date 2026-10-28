import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../api';
import { Blog } from '../../types';
import { Trash2, Heart, MessageCircle, RefreshCw, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const GRID_COLS = 'md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_140px_130px_112px]';

export default function AdminBlogsPage() {
  const { user } = useStore();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBlogs = async () => {
    setBlogsLoading(true);
    try {
      const response = await api.get('/api/blog');
      setBlogs(Array.isArray(response.data) ? response.data : response.data.blogs || []);
    } catch (e) {
      // Handled
    } finally {
      setBlogsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate('/blogs');
      return;
    }
    fetchBlogs();
  }, [user, navigate]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete(`/api/blog/${id}`);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      toast.success(`Successfully deleted "${title}"`);
    } catch (e: any) {
      const msg = e.response?.data?.message || `Failed to delete "${title}"`;
      toast.error(msg);
    }
  };

  const filteredBlogs = (blogs || []).filter((blog) => {
    const authorName = typeof blog.author === 'object' && blog.author ? blog.author.username : 'Anonymous';
    return (
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      authorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (blogsLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <RefreshCw className="h-5 w-5 animate-spin text-muted" />
        <p className="font-mono text-[13px] text-muted">Loading all articles...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 md:px-16 md:pt-12 animate-fade-in">
      {/* Intro */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Admin controls</p>
          <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-[-0.01em] text-ink md:text-[44px]">Blog Manager</h1>
          <p className="mt-1 text-[15px] text-ink-2">Audit, monitor, and remove blog posts published across the platform.</p>
        </div>

        <div className="relative w-full md:w-[340px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3.5 text-[14px] text-ink placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 md:h-[42px] md:rounded-lg"
            placeholder="Search blogs or authors..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {/* Desktop header */}
        <div className={`hidden items-center gap-4 bg-surface-2 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted md:grid ${GRID_COLS}`}>
          <span>Article Title</span>
          <span>Author</span>
          <span>Published Date</span>
          <span>Metrics</span>
          <span className="text-right">Actions</span>
        </div>

        {filteredBlogs.length > 0 ? (
          <ul>
            {filteredBlogs.map((blog, idx) => {
              const authorName =
                typeof blog.author === 'object' && blog.author ? blog.author.username : 'Anonymous';
              const dateFormatted = blog.createdAt
                ? new Date(blog.createdAt).toLocaleDateString()
                : 'N/A';
              const likes = blog.likes?.length || 0;
              const comments = blog._count?.comments || 0;

              const metrics = (
                <span className="inline-flex items-center gap-3 font-mono text-[12px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {comments}
                  </span>
                </span>
              );

              const removeBtn = (tall?: boolean) => (
                <button
                  onClick={() => handleDelete(blog.id, blog.title)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-danger-soft px-3 text-[13px] font-semibold text-danger transition-[transform,opacity] hover:opacity-85 active:scale-[0.97] ${
                    tall ? 'h-11' : 'h-8'
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              );

              return (
                <li key={blog.id} className={idx === 0 ? 'border-t border-line max-md:border-t-0' : 'border-t border-line'}>
                  {/* Desktop row */}
                  <div className={`hidden items-center gap-4 px-5 py-3.5 md:grid ${GRID_COLS}`}>
                    <div className="min-w-0">
                      <Link
                        to={`/blogs/${encodeURIComponent(blog.title)}`}
                        className="line-clamp-2 font-serif text-[17px] font-medium leading-snug text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4"
                      >
                        {blog.title}
                      </Link>
                      {blog.tags && blog.tags.length > 0 && (
                        <p className="mt-1 truncate font-mono text-[11px] text-muted">
                          {blog.tags.map((tag) => `#${tag.name}`).join('  ')}
                        </p>
                      )}
                    </div>
                    <span className="truncate text-[13px] text-ink-2">@{authorName}</span>
                    <span className="font-mono text-[13px] text-ink-2">{dateFormatted}</span>
                    <div>{metrics}</div>
                    <div className="text-right">{removeBtn()}</div>
                  </div>

                  {/* Phone row */}
                  <div className="px-4 py-4 md:hidden">
                    <Link
                      to={`/blogs/${encodeURIComponent(blog.title)}`}
                      className="block font-serif text-[18px] font-medium leading-snug text-ink active:opacity-70"
                    >
                      {blog.title}
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-[13px] text-ink-2">@{authorName}</p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[12px] text-muted">{dateFormatted}</span>
                          {metrics}
                        </div>
                      </div>
                      {removeBtn(true)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="border-t border-line px-5 py-14 text-center text-[14px] text-muted max-md:border-t-0">
            No articles found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
