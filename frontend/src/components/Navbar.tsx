import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BookOpen, StickyNote, User as UserIcon, LogOut, Users, PenLine, Moon, Sun, LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import { socket } from '../config/socket';
import { useTheme } from '../hooks/useTheme';

export const logo = "/image.png";

type NavItem = { path: string; label: string; icon: LucideIcon };

export function useNavLinks(): NavItem[] {
  const { user } = useStore();
  if (user?.role === 'ADMIN') {
    return [
      { path: '/admin/notes', label: 'Notes', icon: StickyNote },
      { path: '/admin/blogs', label: 'Blogs', icon: BookOpen },
      { path: '/admin/users', label: 'Users', icon: Users },
    ];
  }
  return [
    ...(user ? [{ path: '/', label: 'Notes', icon: StickyNote }] : []),
    { path: '/blogs', label: 'Blogs', icon: BookOpen },
    ...(user ? [{ path: '/profile', label: 'Profile', icon: UserIcon }] : []),
  ];
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 shrink-0">
      <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-accent text-on-accent">
        <PenLine className="h-[15px] w-[15px]" strokeWidth={2.25} />
      </span>
      <span className="font-serif text-[23px] font-semibold tracking-[-0.02em] text-ink leading-none">furepay</span>
    </Link>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 active:scale-95 ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

function useSocketStatus() {
  const [online, setOnline] = useState(socket.connected);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, []);
  return online;
}

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const navLinks = useNavLinks();
  const online = useSocketStatus();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    try {
      const { data } = await api.post('/api/user/logout');
      if (data.success) {
        await logout();
        navigate('/auth/signin');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Logout failed');
    }
  };

  // The editor has its own full-screen top bar
  if (location.pathname.startsWith('/blogs/new') || location.pathname.startsWith('/blogs/edit')) return null;
  // Auth pages are full-bleed
  if (location.pathname.startsWith('/auth')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md pt-safe">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1440px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 md:gap-10">
          <Logo to={isAdmin ? '/admin/blogs' : '/'} />
          {isAdmin && (
            <span className="rounded-[5px] bg-ink px-2 py-[3px] font-mono text-[10px] font-semibold tracking-[0.1em] text-bg">
              ADMIN
            </span>
          )}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-surface-2 font-semibold text-ink' : 'font-medium text-ink-2 hover:bg-surface-2/60 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-ink' : 'text-muted'}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          {user ? (
            <>
              <div className="hidden items-center gap-1.5 md:flex" title={online ? 'Real-time updates connected' : 'Reconnecting…'}>
                <span className={`h-[7px] w-[7px] rounded-full ${online ? 'bg-success' : 'bg-muted'}`} />
                <span className="font-mono text-xs text-muted">{online ? 'Live' : 'Offline'}</span>
              </div>
              <span className="hidden h-5 w-px bg-line md:block" />
              {isAdmin ? (
                <span className="hidden font-mono text-xs text-muted md:block">{user.email}</span>
              ) : (
                <Link to="/profile" className="hidden items-center gap-2.5 md:flex">
                  <Avatar name={user.username} src={user.avatar} size={32} />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[13px] font-semibold text-ink">{user.username}</span>
                    <span className="font-mono text-[11px] text-muted">{user.plan === 'PREMIUM' ? 'Premium' : 'Free plan'}</span>
                  </span>
                </Link>
              )}
              <ThemeToggle />
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 active:scale-95 md:border md:border-line"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                to="/auth/signin"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="inline-flex items-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-bg transition-transform active:scale-[0.97]"
              >
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Avatar({ name, src, size = 32, className = '' }: { name?: string; src?: string; size?: number; className?: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.4)) };
  if (src) {
    return <img src={src} alt={name} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent-ink ${className}`}>
      {initial}
    </span>
  );
}

/** Android-style bottom navigation, shown on phones only */
export function BottomNav() {
  const { user } = useStore();
  const navLinks = useNavLinks();
  const location = useLocation();

  if (!user) return null;
  if (location.pathname.startsWith('/blogs/new') || location.pathname.startsWith('/blogs/edit')) return null;
  // Article pages use their own bottom action bar on phones
  if (/^\/blogs\/[^/]+$/.test(location.pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md pb-safe md:hidden">
      <div className="flex h-16 items-stretch px-2">
        {navLinks.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end
            className="flex flex-1 flex-col items-center justify-center gap-1 active:opacity-70"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid h-8 w-16 place-items-center rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-accent-soft text-accent-ink' : 'text-ink-2'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} />
                </span>
                <span className={`text-xs ${isActive ? 'font-semibold text-ink' : 'font-medium text-ink-2'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
