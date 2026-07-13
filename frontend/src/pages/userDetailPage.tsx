import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AtSign,
  BookOpen,
  CalendarDays,
  Crown,
  ShieldCheck,
  UserCircle2,
  Ban,
  CheckCircle2,
  Heart,
  MessageCircle,
  Tag,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  UserIcon,
  LoaderIcon,
  ArrowLeft,
} from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { Blog, User } from "../types";

const UserDetailPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showBlogs, setShowBlogs] = useState<boolean>(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();


  const getUserData = async () => {
    setLoadingUser(true);
    try {
      const { data } = await api.get(`/api/user/${id}`);
      if (data.success) {
        setUser(data.user);
      }
    } catch {
      toast.error("Failed to fetch user");
    } finally {
      setLoadingUser(false);
    }
  };

  const loadBlogs = async () => {
    if (!user?.id) return;
    if (hasLoaded && blogs.length > 0) return; // Don't reload if already loaded
    
    setLoading(true);
    try {
      const { data } = await api.get(`/api/blog/user/${user.id}`);
      if (data.success) {
        setBlogs(data.blogs);
        setHasLoaded(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) getUserData();
  }, [id]);

  useEffect(() => {
    if (showBlogs && user?.id && !hasLoaded) {
      loadBlogs();
    }
  }, [showBlogs]);

  const toggleBlogs = () => {
    setShowBlogs((prev) => !prev);
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoaderIcon className="h-4 w-4 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div
      onClick={() => navigate(-1)}
        className="inline-flex items-center cursor-pointer pb-6 space-x-1.5 text-sm font-serif font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back</span>
      </div>

      {/* User Profile Card - Original Style */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-emerald-600 via-emerald-700 to-sky-500" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <img
                src={user.avatar}
                alt={user.username}
                className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg"
              />

              <div>
                <h1 className="text-2xl font-bold text-white">
                  @{user.username}
                </h1>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <UserCircle2 size={14} />
                    {user.role}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      user.plan === "PREMIUM"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Crown size={14} />
                    {user.plan}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      user.isBlocked
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {user.isBlocked ? (
                      <Ban size={14} />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}

                    {user.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 md:p-4 p-2 transition hover:border-amber-300">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AtSign size={18} />
              </div>

              <p className="text-xs text-gray-500">Email</p>
              <p className="mt-1 break-all text-sm font-medium text-gray-900">
                {user.email}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 md:p-4 p-2 transition hover:border-amber-300">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldCheck size={18} />
              </div>

              <p className="text-xs text-gray-500">Account Status</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {user.isBlocked ? "Blocked" : "Active"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 md:p-4 p-2 transition hover:border-amber-300 sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <CalendarDays size={18} />
              </div>

              <p className="text-xs text-gray-500">Member Since</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">About</h2>
            <p className="text-sm leading-7 text-gray-600">
              {user.bio || "This user hasn't added a bio yet."}
            </p>
          </div>
        </div>
      </div>

      {/* Simple Toggle Button - Amber 900 */}
      <div className="mt-6">
        <button
          onClick={toggleBlogs}
          className="inline-flex items-center gap-2 text-white p-2 rounded-sm cursor-pointer hover:bg-amber-950 px-4 bg-amber-900 font-medium text-sm"
        >
          {showBlogs ? (
            <>
              <EyeOff size={18} />
              Hide Blogs
            </>
          ) : (
            <>
              <Eye size={18} />
              Show Blogs
            </>
          )}
          {showBlogs && blogs.length > 0 && (
            <span className="text-amber-100">({blogs.length})</span>
          )}
        </button>
      </div>

      {/* Blogs Grid */}
      {showBlogs && (
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderIcon className="h-4 w-4 animate-spin text-amber-500" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No blogs published</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {blogs.map((blog) => {
                const authorName = blog.author?.username || "Unknown";
                const authorAvatar = blog.author?.avatar;
                const formattedDate = new Date(blog.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );
                const likesCount = blog._count?.likes || 0;
                const commentsCount = blog._count?.comments || 0;

                return (
                  <Link
                    key={blog.id}
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
                              {blog.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-serif font-medium bg-amber-50/80 text-amber-800 border border-amber-100 backdrop-blur-sm"
                                >
                                  <Tag className="h-2.5 w-2.5 shrink-0 text-amber-600" />
                                  <span>{tag.name}</span>
                                </span>
                              ))}
                              {blog.tags.length > 3 && (
                                <span className="text-[10px] text-neutral-400 font-serif">
                                  +{blog.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Author */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            {authorAvatar ? (
                              <img 
                                src={authorAvatar} 
                                alt={authorName}
                                className="w-8 h-8 rounded-full object-cover border border-amber-200"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                                <UserIcon className="h-4 w-4 text-amber-600" />
                              </div>
                            )}
                            
                            <div className="flex flex-col">
                              <span className="text-xs font-serif font-medium text-amber-900">
                                @{authorName}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-serif flex items-center space-x-1">
                                <CalendarDays className="h-2.5 w-2.5" />
                                <span>{formattedDate}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Comments */}
                            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-medium text-blue-600 bg-blue-50/60 border border-blue-100">
                              <MessageCircle className="h-3 w-3 text-blue-500" />
                              <span className="font-semibold">{commentsCount}</span>
                            </div>

                            {/* Like */}
                            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-medium text-neutral-500">
                              <Heart className="h-3 w-3" />
                              <span>{likesCount}</span>
                            </div>

                            {/* Read Full */}
                            <div className="inline-flex items-center space-x-1 text-[10px] font-serif font-semibold text-amber-900 group-hover:text-amber-700 transition-colors">
                              <span className="max-md:hidden">Read</span>
                              <ArrowRight className="h-3 w-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetailPage;