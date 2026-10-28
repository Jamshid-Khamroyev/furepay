import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Crown,
  Heart,
  Eye,
  EyeOff,
  LoaderIcon,
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { Blog, User } from "../types";
import { Avatar } from "../components/Navbar";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{label}</p>
      <div className="mt-1 truncate text-[14px] font-medium text-ink">{children}</div>
    </div>
  );
}

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
        <LoaderIcon className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="font-serif text-[20px] text-muted">User not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[880px] px-5 pb-24 pt-8 md:px-0">
      <button
        onClick={() => navigate(-1)}
        className="-ml-2 mb-6 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[14px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink active:scale-[0.97]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back</span>
      </button>

      {/* Hero */}
      <section className="flex flex-col gap-5 border-b border-line pb-9 sm:flex-row sm:items-start sm:gap-7">
        <Avatar name={user.username} src={user.avatar} size={104} className="hidden sm:block" />
        <Avatar name={user.username} src={user.avatar} size={64} className="sm:hidden" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-all font-serif text-[30px] leading-tight tracking-[-0.01em] text-ink md:text-[44px]">
              {user.username}
            </h1>
            {user.plan === "PREMIUM" && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-[3px] text-accent-ink">
                <Crown className="h-3.5 w-3.5" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.08em]">PREMIUM</span>
              </span>
            )}
          </div>

          <p className={`mt-3 text-[16px] leading-relaxed ${user.bio ? "text-ink-2" : "text-muted"}`}>
            {user.bio || "This user hasn't added a bio yet."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:flex sm:flex-wrap">
            <Fact label="Member since">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </Fact>
            <Fact label="Account status">
              <span className="inline-flex items-center gap-2">
                <span className={`h-[7px] w-[7px] rounded-full ${user.isBlocked ? "bg-danger" : "bg-success"}`} />
                {user.isBlocked ? "Blocked" : "Active"}
              </span>
            </Fact>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <Fact label="Email">{user.email}</Fact>
            </div>
          </div>
        </div>
      </section>

      {/* Published */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-[26px] leading-tight text-ink">Published</h2>
            {showBlogs && hasLoaded && (
              <span className="font-mono text-[12px] text-muted">
                {blogs.length} {blogs.length === 1 ? "article" : "articles"}
              </span>
            )}
          </div>
          <button
            onClick={toggleBlogs}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 text-[14px] font-medium text-ink transition-colors hover:bg-surface-2 active:scale-[0.97] md:h-10"
          >
            {showBlogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showBlogs ? "Hide articles" : "Show articles"}
          </button>
        </div>

        {showBlogs && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center border-t border-line py-12">
                <LoaderIcon className="h-5 w-5 animate-spin text-muted" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="border-t border-line py-14 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-line-strong" />
                <p className="mt-3 text-[14px] text-muted">No blogs published</p>
              </div>
            ) : (
              <ul>
                {blogs.map((blog) => {
                  const shortDate = new Date(blog.createdAt)
                    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    .toUpperCase();
                  const likesCount = blog._count?.likes || 0;

                  return (
                    <li key={blog.id} className="border-t border-line">
                      <Link
                        to={`/blogs/${encodeURIComponent(blog.slug)}`}
                        className="group flex min-h-[44px] items-center gap-4 py-[18px] transition-colors active:bg-surface-2"
                      >
                        <span className="w-16 shrink-0 font-mono text-[12px] text-muted">{shortDate}</span>
                        <span className="min-w-0 flex-1 font-serif text-[18px] leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4 md:text-[20px]">
                          {blog.title}
                        </span>
                        <span className="hidden shrink-0 items-center gap-1 font-mono text-[12px] text-muted sm:inline-flex">
                          <Heart className="h-3.5 w-3.5" />
                          {likesCount}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-ink-2 group-hover:text-ink">
                          <span className="hidden sm:inline">Read</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserDetailPage;
