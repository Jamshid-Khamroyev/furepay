import React, { useEffect, ReactNode, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Navbar, { BottomNav } from './components/Navbar';
import NotesPage from './pages/NotesPage';
import BlogsPage from './pages/BlogsPage';
import { api } from './api';
import { LoaderIcon } from 'lucide-react';
import { socket } from './config/socket';

// Split rarely-first pages (and the heavy TipTap editor) into their own chunks for faster first load on phones
const SigninPage = lazy(() => import('./pages/SigninPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const BlogEditorPage = lazy(() => import('./pages/BlogEditorPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UserDetailPage = lazy(() => import('./pages/userDetailPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminBlogsPage = lazy(() => import('./pages/admin/AdminBlogsPage'));
const AdminNotesPage = lazy(() => import('./pages/admin/AdminNotesPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <LoaderIcon className="h-5 w-5 animate-spin text-accent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function UserRoute({ children }: { children: ReactNode }) {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/blogs" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [loading, setLoading] = useState<boolean>(true)
  const { user, signup } = useStore();

  const Me = async () => {
    if(user) return setLoading(false)
    try { 
      const { data } = await api.get('/api/user/me');
      if(data.success){
        signup(data.user);
      }
    } catch (error) {
      console.log("Failed to fetch user data. Please try again");
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Me();
  },[])

  useEffect(() => {
    if(!user) return
    socket.connect();
    socket.on("connect", () => {});
    socket.on("disconnect", () => {});

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [user]);

  return (
    <BrowserRouter>
    {loading ? (
      <div className='h-dvh w-screen flex items-center justify-center bg-bg'>
        <LoaderIcon className='h-5 w-5 animate-spin text-accent' />
      </div>
    ) : (
      <div className="min-h-dvh flex flex-col bg-bg text-ink">
        <Navbar />
        <main className={`flex-grow ${user ? 'pb-[var(--nav-h)]' : ''}`}>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth routes */}
            <Route 
              path="/auth/signin" 
              element={!user ? <SigninPage /> : <Navigate to={user.role === 'ADMIN' ? '/admin/blogs' : '/'} replace />} 
            />
            <Route 
              path="/auth/signup" 
              element={!user ? <SignupPage /> : <Navigate to={user.role === 'ADMIN' ? '/admin/blogs' : '/'} replace />} 
            />

            {/* Admin-only routes */}
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/blogs" element={<AdminRoute><AdminBlogsPage /></AdminRoute>} />
            <Route path="/admin/notes" element={<AdminRoute><AdminNotesPage /></AdminRoute>} />

            {/* Shared & User-specific routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  {user?.role === 'ADMIN' ? (
                    <Navigate to="/admin/blogs" replace />
                  ) : (
                    <NotesPage />
                  )}
                </ProtectedRoute>
              } 
            />
            <Route path="/blogs/new" element={<UserRoute><BlogEditorPage /></UserRoute>} />
            <Route path="/blogs/edit/:id" element={<UserRoute><BlogEditorPage /></UserRoute>} />
            <Route path="/blogs/:title" element={<ProtectedRoute><BlogDetailPage /></ProtectedRoute>} />
            <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />
            <Route path="/profile/:id" element={<UserRoute><UserDetailPage /></UserRoute>} />
            
            <Route path="/blogs" element={<BlogsPage />} />
            
            {/* Fallback */}
            <Route 
              path="*" 
              element={
                <Navigate 
                  to={user ? (user.role === 'ADMIN' ? '/admin/blogs' : '/') : '/auth/signin'} 
                  replace 
                />
              } 
            />
          </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
    )}
    </BrowserRouter>
  );
}
