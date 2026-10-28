import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api';
import BlogCard from '../components/BlogCard';
import { Search, Plus, X, TrendingUp, LoaderIcon, Clock, History, Flame, PenLine } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Blog } from '../types';
import { toast } from 'sonner';
import { socket } from '../config/socket';

type ActiveView = 'default' | 'search' | 'tag' | 'filter';
type FilterType = 'latest' | 'oldest' | 'popular' | 'trending';

// How many blogs to pull per filter request
const FILTER_LIMIT = 20;

const FILTER_OPTIONS: { type: FilterType; label: string; icon: typeof Clock }[] = [
  { type: 'latest', label: 'Latest', icon: Clock },
  { type: 'oldest', label: 'Oldest', icon: History },
  { type: 'popular', label: 'Popular', icon: Flame },
  { type: 'trending', label: 'Trending', icon: TrendingUp },
];

export default function BlogsPage() {
  const { user, blogs, setBlogs, deleteBlog } = useStore();
  const [displayBlogs, setDisplayBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('default');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const navigate = useNavigate();

  const loadDefaultBlogs = async () => {
    setActiveView('default');
    setActiveTag(null);
    setActiveFilter(null);
    setSearchQuery('');

    if (blogs.length > 0) {
      setDisplayBlogs(blogs);
      return;
    }

    setBlogsLoading(true);
    try {
      const response = await api.get('/api/blog');
      const data = response.data;
      const list = data?.success ? (data.blogs || []) : [];
      setBlogs(list);
      setDisplayBlogs(list);
    } catch (e) {
      console.error('Error fetching blogs:', e);
      toast.error('Maqolalarni yuklashda xatolik yuz berdi');
    } finally {
      setBlogsLoading(false);
    }
  };

  const searchBlogs = async (query: string) => {
    setActiveView('search');
    setActiveTag(null);
    setActiveFilter(null);
    setBlogsLoading(true);
    try {
      const response = await api.get(`/api/blog/search?q=${encodeURIComponent(query)}`);
      const data = response.data;
      setDisplayBlogs(data?.success ? (data.blogs || []) : []);
    } catch (e) {
      console.error('Error searching blogs:', e);
      toast.error('Qidiruvda xatolik yuz berdi');
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchByTag = async (tag: string) => {
    setActiveView('tag');
    setActiveTag(tag);
    setActiveFilter(null);
    setSearchQuery('');
    setBlogsLoading(true);
    try {
      const response = await api.get(`/api/blog/tag/${encodeURIComponent(tag)}`);
      const data = response.data;
      setDisplayBlogs(data?.success ? (data.blogs || []) : []);
    } catch (e) {
      console.error('Error fetching blogs by tag:', e);
      toast.error("Teg bo'yicha maqolalarni yuklashda xatolik yuz berdi");
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchByFilter = async (filter: FilterType) => {
    setActiveView('filter');
    setActiveFilter(filter);
    setActiveTag(null);
    setSearchQuery('');
    setBlogsLoading(true);
    try {
      const response = await api.get(`/api/blog/filter?filter=${filter}&limit=${FILTER_LIMIT}`);
      const data = response.data;
      setDisplayBlogs(data?.success ? (data.blogs || []) : []);
    } catch (e) {
      console.error(`Error fetching ${filter} blogs:`, e);
      toast.error("Filtr bo'yicha maqolalarni yuklashda xatolik yuz berdi");
    } finally {
      setBlogsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/blogs', { replace: true });
      return;
    }
    loadDefaultBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchBlogs(searchQuery.trim());
    } else {
      loadDefaultBlogs();
    }
  };

  const handleClearFilters = () => {
    loadDefaultBlogs();
  };

  const handleLikeToggle = (blogId: string, isLiked: boolean) => {
    if (!user) return;

    const applyToggle = (list: Blog[]) =>
      list.map((b) => {
        if (b.id !== blogId) return b;
        return {
          ...b,
          likes: isLiked
            ? b.likes.filter((like) => like.userId !== user.id)
            : [...b.likes, { userId: user.id }],
        };
      });

    setDisplayBlogs((prev) => applyToggle(prev));
    if (blogs.length > 0) {
      setBlogs(applyToggle(blogs));
    }
  };

  useEffect(() => {
    socket.on("blog:created", (data: Blog) => {
      const newBlogs = [data, ...blogs];
      setBlogs(newBlogs);
      setDisplayBlogs(newBlogs);
    });
  
    socket.on("blog:like", (data: { like: { userId: string }; blogId: string }) => {
      if(data.like.userId === user.id) return
      setDisplayBlogs(prev =>
        prev.map(b =>
          b.id === data.blogId
            ? {
                ...b,
                likes: b.likes.some(l => l.userId === data.like.userId)
                  ? b.likes
                  : [...b.likes, data.like],
              }
            : b
        )
      );
    });
  
    socket.on("blog:unlike", (data: { like: { userId: string }; blogId: string }) => {
      if(data.like.userId === user.id) return
      setDisplayBlogs(prev =>
        prev.map(b =>
          b.id === data.blogId
            ? {
                ...b,
                likes: b.likes.filter(l => l.userId !== data.like.userId),
              }
            : b
        )
      );
    });
  
    return () => {
      socket.off("blog:created");
      socket.off("blog:like");
      socket.off("blog:unlike");
    };
  }, [socket, blogs]);

  const tagSource = blogs.length > 0 ? blogs : displayBlogs;
  const tagCounts = new Map<string, number>();
  tagSource.forEach((b) => {
    const tags = Array.isArray((b as any).tags) ? ((b as any).tags as { name: string }[]) : [];
    tags.forEach((t) => {
      if (!t?.name) return;
      tagCounts.set(t.name, (tagCounts.get(t.name) || 0) + 1);
    });
  });
  const availableTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  const isFiltered = activeView !== 'default';
  const isFreeUser = !!user && user.role !== 'ADMIN' && user.plan !== 'PREMIUM';
  const myBlogsCount = user && blogs.length > 0
    ? blogs.filter((b) => typeof b.author === 'object' && b.author && b.author.id === user.id).length
    : null;

  const tagChip = (tag: string) => {
    const isActive = activeView === 'tag' && activeTag === tag;
    return (
      <button
        key={tag}
        onClick={() => fetchByTag(tag)}
        className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs transition-colors cursor-pointer active:scale-[0.97] max-md:min-h-[36px] max-md:px-3 ${
          isActive ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-2 hover:text-ink'
        }`}
      >
        #{tag}
      </button>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-24 pt-8 md:pt-14 pb-20 animate-fade-in">
      {/* Intro */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent-ink">Blogs · Public feed</p>
          <h1 className="mt-3 font-serif text-[34px] md:text-[56px] leading-[1.05] tracking-tight text-ink">
            Articles &amp; Insights
          </h1>
          <p className="mt-3 text-ink-2 text-[15px] md:text-base">
            Explore thoughts, articles, and discussions from our members.
          </p>
        </div>
        {user && (
          <Link
            to="/blogs/new"
            className="hidden md:inline-flex items-center gap-2 shrink-0 bg-ink text-bg font-semibold rounded-lg px-4 py-2.5 text-sm hover:opacity-90 active:scale-[0.97] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div className="mt-8 md:mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-5">
        <form onSubmit={handleSearch} className="relative w-full md:w-[420px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by title or contents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full h-[44px] md:h-[42px] pl-9 pr-3 rounded-lg bg-surface border border-line-strong text-base md:text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
          />
          <button type="submit" className="sr-only">Search</button>
        </form>

        {/* Segmented control (desktop) / chip row (phone) */}
        <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 md:gap-0 md:inline-flex md:bg-surface-2 md:p-[3px] md:rounded-[9px]">
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeView === 'filter' && activeFilter === option.type;
              return (
                <button
                  key={option.type}
                  onClick={() => fetchByFilter(option.type)}
                  className={`shrink-0 inline-flex items-center justify-center text-sm cursor-pointer transition active:scale-[0.97] max-md:min-h-[40px] max-md:px-4 max-md:rounded-full max-md:border md:px-3.5 md:py-1.5 md:rounded-[7px] ${
                    isActive
                      ? 'font-semibold max-md:bg-ink max-md:text-bg max-md:border-ink md:bg-surface md:shadow-sm md:text-ink'
                      : 'max-md:bg-surface max-md:border-line-strong text-ink-2 hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tag row (phones / tablets) */}
      {(availableTags.length > 0 || isFiltered) && (
        <div className="lg:hidden -mx-4 px-4 md:mx-0 md:px-0 mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {availableTags.map(tagChip)}
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="shrink-0 inline-flex items-center gap-1 px-2 min-h-[36px] text-sm text-ink-2 underline underline-offset-4 cursor-pointer active:opacity-70"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="mt-2 lg:mt-6 flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* List */}
        <div className="flex-1 min-w-0">
          {blogsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <LoaderIcon className="h-5 w-5 animate-spin text-muted" />
              <p className="font-mono text-xs text-muted">Fetching latest blogs...</p>
            </div>
          ) : displayBlogs.length === 0 ? (
            <div className="text-center py-24 border-b border-line">
              <p className="font-serif text-xl text-ink">No blog posts found matching your criteria.</p>
              <button
                onClick={handleClearFilters}
                className="mt-5 inline-flex items-center px-4 py-2.5 min-h-[44px] md:min-h-0 rounded-lg bg-surface border border-line-strong text-sm font-medium text-ink hover:bg-surface-2 cursor-pointer active:scale-[0.97] transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div>
              {displayBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} setBlogs={setDisplayBlogs} onLikeToggle={handleLikeToggle} />
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="w-full lg:w-[320px] shrink-0 space-y-10 lg:pt-7">
          {availableTags.length > 0 && (
            <section className="hidden lg:block">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Browse by tag</h2>
              <div className="mt-4 flex flex-wrap gap-2">{availableTags.map(tagChip)}</div>
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-sm text-ink-2 underline underline-offset-4 hover:text-ink cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </section>
          )}
          {availableTags.length === 0 && isFiltered && (
            <button
              onClick={handleClearFilters}
              className="hidden lg:inline text-sm text-ink-2 underline underline-offset-4 hover:text-ink cursor-pointer"
            >
              Clear filters
            </button>
          )}

          {isFreeUser && (
            <section>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Your writing</h2>
              <div className="mt-4 bg-surface border border-line rounded-xl p-5">
                {myBlogsCount !== null && (
                  <p className="font-serif text-4xl tracking-tight text-ink">
                    {myBlogsCount} <span className="text-muted">/ 5</span>
                  </p>
                )}
                <p className={`${myBlogsCount !== null ? 'mt-2 ' : ''}text-sm leading-relaxed text-ink-2`}>
                  Free plan users can create up to 5 blogs and 5 tags per blog. Upgrade to write without limits.
                </p>
                <Link
                  to="/profile"
                  className="mt-4 inline-flex items-center justify-center w-full rounded-lg bg-accent text-on-accent font-semibold text-sm px-4 py-2.5 min-h-[44px] md:min-h-0 hover:opacity-90 active:scale-[0.97] transition"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* Phone extended FAB */}
      {user && (
        <Link
          to="/blogs/new"
          aria-label="Create Article"
          style={{ bottom: 'calc(var(--nav-h) + 16px)' }}
          className="md:hidden fixed right-4 z-30 inline-flex items-center gap-2 h-14 px-5 rounded-2xl bg-ink text-bg font-semibold shadow-lg active:scale-[0.97] transition"
        >
          <PenLine className="h-5 w-5" />
          <span>Write</span>
        </Link>
      )}
    </div>
  );
}
