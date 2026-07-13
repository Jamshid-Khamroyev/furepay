import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BookOpen, StickyNote, User as UserIcon, LogOut, LogIn, UserPlus, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';
import { toast } from 'sonner';

export const logo = "/image.png";

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { data } = await api.post('/api/user/logout')
      if(data.success){
        await logout();
        navigate('/auth/signin');
      }
      setMobileMenuOpen(false);
    } catch (error) {
      toast.error(error.response.data.message)
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === 'ADMIN';

  // Navigation links
  const getNavLinks = () => {
    if (isAdmin) {
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
  };

  const navLinks = getNavLinks();

  return (
    <nav className="sticky top-0 z-50 bg-[#fbfaf3] font-medium border-b border-amber-900/90">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 max-md:border-b">
          {/* Logo */}
          <Link 
            to={isAdmin ? "/admin/blogs" : "/"} 
            className="flex items-center space-x-2 shrink-0"
          >
            <img alt='logo' src={logo} className='h-28 w-44'/>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 text-sm font-serif font-medium rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-amber-900 text-amber-100'
                    : 'text-neutral-600 hover:bg-amber-50 hover:text-neutral-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* User info - desktop */}
                <div className="hidden md:flex items-center space-x-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                  <UserIcon className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-medium text-neutral-800">{user.username}</span>
                  {isAdmin && (
                    <span className="text-[10px] uppercase font-bold bg-amber-600 text-white px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>

                {/* Logout - desktop */}
                <button
                  onClick={handleLogout}
                  className="hidden md:inline-flex items-center space-x-1 px-3 py-2 border border-amber-200 rounded-lg text-sm font-serif font-medium text-amber-900 bg-amber-50/50 hover:bg-amber-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6 text-amber-900" />
                  ) : (
                    <Menu className="h-6 w-6 text-amber-900" />
                  )}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className="hidden sm:inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center space-x-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-amber-100 bg-[#fbfaf3] px-4 py-4 space-y-2 animate-slide-down">
          {/* Navigation links - mobile */}
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-serif font-medium transition-colors ${
                isActive(path)
                  ? 'bg-amber-900 text-amber-100'
                  : 'text-neutral-600 hover:bg-amber-900 hover:text-neutral-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}

          {/* Logout - mobile */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-serif font-medium text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-amber-100 pt-3"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}