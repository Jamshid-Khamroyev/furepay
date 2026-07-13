import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../api';
import { Blog } from '../../types';
import { Shield, Trash2, Calendar, ThumbsUp, Link as LinkIcon, RefreshCw, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-neutral-600 font-mono">Loading all articles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in bg-[#fdfcf7]">
      <div className="border-b border-amber-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-extrabold tracking-tight text-amber-955 flex items-center space-x-2">
            <Shield className="h-8 w-8 text-amber-900" />
            <span>Admin Controls: Blog Manager</span>
          </h1>
          <p className="text-neutral-600 font-serif mt-1">Audit, monitor, and remove blog posts published across the platform.</p>
        </div>

        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-amber-700" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900"
            placeholder="Search blogs or authors..."
          />
        </div>
      </div>

      <div className="block md:hidden space-y-4">
        {filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog) => {
            const authorName =
              typeof blog.author === 'object' && blog.author ? blog.author.username : 'Anonymous';
            const dateFormatted = blog.createdAt
              ? new Date(blog.createdAt).toLocaleDateString()
              : 'N/A';

            return (
              <div key={blog.id} className="bg-[#fffefb] border border-amber-200/60 rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <Link
                    to={`/blogs/${encodeURIComponent(blog.title)}`}
                    className="font-serif font-bold text-amber-950 hover:text-amber-700 text-base flex items-center gap-1 leading-tight"
                  >
                    <span>{blog.title}</span>
                    <LinkIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-1">
                  {blog.tags?.map((tag) => (
                    <span
                      key={tag.name}
                      className="inline-flex items-center text-[10px] bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-amber-800"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-amber-100">
                  <div className="space-y-0.5">
                    <span className="block text-amber-900 font-serif">by @{authorName}</span>
                    <span className="block font-mono text-[10px]">{dateFormatted}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 font-mono text-neutral-600 text-[11px] mr-1">
                      <ThumbsUp className="h-3.5 w-3.5 text-amber-700" />
                      <span>{blog.likes?.length || 0}</span>
                    </span>
                    <button
                      onClick={() => handleDelete(blog.id, blog.title)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-serif font-semibold cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-neutral-500 font-serif bg-[#fffefb] border border-dashed border-amber-200 rounded-xl">
            No articles found matching criteria.
          </div>
        )}
      </div>

      <div className="hidden md:block bg-[#fffefb] border border-amber-200/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-amber-200 text-left text-sm">
            <thead className="bg-amber-50/50 font-serif text-xs uppercase text-amber-955">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold">Article Title</th>
                <th scope="col" className="px-6 py-4 font-bold">Author</th>
                <th scope="col" className="px-6 py-4 font-bold">Published Date</th>
                <th scope="col" className="px-6 py-4 font-bold">Metrics</th>
                <th scope="col" className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 bg-[#fffefb]">
              {filteredBlogs.length > 0 ? (
                filteredBlogs.map((blog) => {
                  const authorName =
                    typeof blog.author === 'object' && blog.author ? blog.author.username : 'Anonymous';

                  const dateFormatted = blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString()
                    : 'N/A';

                  return (
                    <tr key={blog.id} className="hover:bg-amber-50/25 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Link
                            to={`/blogs/${encodeURIComponent(blog.title)}`}
                            className="font-serif font-bold text-amber-955 hover:text-amber-700 hover:underline flex items-center space-x-1"
                          >
                            <span>{blog.title}</span>
                            <LinkIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          </Link>
                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {blog.tags.map((tag) => (
                                <span
                                  key={tag.name}
                                  className="inline-flex items-center space-x-0.5 text-[10px] bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded font-serif text-amber-800"
                                >
                                  <span>#{tag.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-amber-900 font-serif font-medium">
                        @{authorName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-neutral-500 font-mono text-xs">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-amber-700" />
                          <span>{dateFormatted}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-neutral-600 text-xs">
                        <span className="flex items-center space-x-1 font-mono">
                          <ThumbsUp className="h-3.5 w-3.5 text-amber-700" />
                          <span>{blog.likes?.length || 0} Likes</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(blog.id, blog.title)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-red-100 rounded-lg text-xs font-serif font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-500 font-serif">
                    No articles match your database index criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
