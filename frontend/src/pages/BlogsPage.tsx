import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api';
import BlogCard from '../components/BlogCard';
import { Search, Plus, X, TrendingUp, Tag, LoaderIcon, Clock, History, Flame } from 'lucide-react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-amber-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-extrabold tracking-tight text-amber-950">Articles & Insights</h1>
          <p className="text-neutral-600 font-serif mt-1">Explore thoughts, articles, and discussions from our members.</p>
        </div>
        {user && (
          <Link
            to="/blogs/new"
            className="inline-flex items-center space-x-1 px-4 py-2 bg-amber-900 text-white rounded font-serif font-medium text-sm hover:bg-amber-800 self-start md:self-auto shrink-0 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4 bg-[#fffefb] border border-amber-500 p-4 md:p-5 rounded-xl shadow-sm">
        <div className="flex flex-col xl:grid xl:grid-cols-[380px_1fr] gap-4 xl:gap-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 w-full xl:space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-amber-700" />
              </div>

              <input
                type="text"
                placeholder="Search by title or contents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-amber-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-base sm:text-sm font-serif text-neutral-900"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-amber-900 border border-amber-200 rounded-lg text-sm font-serif font-medium text-amber-50 hover:bg-amber-950 cursor-pointer xl:w-full"
            >
              Search
            </button>
          </form>

          <div className="space-y-4">

            <div className="grid grid-cols-4 xl:flex xl:flex-wrap items-center md:gap-2 gap-1 border-b border-gray-300 py-2">
              {FILTER_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive =
                  activeView === "filter" &&
                  activeFilter === option.type;

                return (
                  <button
                    key={option.type}
                    onClick={() => fetchByFilter(option.type)}
                    className={`flex justify-center items-center gap-1.5 md:px-3 px-1 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-amber-900 text-white border-amber-900"
                        : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <Icon className="md:h-3.5 md:w-3.5 h-2 w-2 xl:h-4 xl:w-4" />
                    <span className="text-[10px] xl:text-sm">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {availableTags.length > 0 && (
              <div className="grid grid-cols-3 xl:flex xl:flex-wrap items-center md:gap-2 gap-1 border-b border-gray-300 py-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => fetchByTag(tag)}
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-serif font-semibold border transition-colors cursor-pointer ${
                      activeView === "tag" && activeTag === tag
                        ? "bg-amber-900 text-white border-amber-900"
                        : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {isFiltered && (
              <div className="flex xl:justify-end">
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-serif font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                  <span>Clear Filters</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {blogsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <LoaderIcon className="h-4 w-4 animate-spin text-amber-600" />
          <p className="text-sm font-medium text-neutral-600 font-mono">Fetching latest blogs...</p>
        </div>
      ) : displayBlogs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-amber-200 rounded-lg bg-[#fffefb]">
          <p className="text-amber-900 font-serif text-lg">No blog posts found matching your criteria.</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 inline-flex items-center space-x-1 px-4 py-2 border border-amber-200 rounded-lg text-sm font-serif font-medium text-amber-950 bg-amber-50 hover:bg-amber-100 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} setBlogs={setDisplayBlogs} onLikeToggle={handleLikeToggle} />
          ))}
        </div>
      )}
    </div>
  );
}