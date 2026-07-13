import React, { useEffect, ReactNode, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import SigninPage from './pages/SigninPage';
import SignupPage from './pages/SignupPage';
import BlogsPage from './pages/BlogsPage';
import BlogDetailPage from './pages/BlogDetailPage';
import BlogEditorPage from './pages/BlogEditorPage';
import NotesPage from './pages/NotesPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBlogsPage from './pages/admin/AdminBlogsPage';
import AdminNotesPage from './pages/admin/AdminNotesPage';
import { api } from './api';
import { LoaderIcon } from 'lucide-react';
import UserDetailPage from './pages/userDetailPage';
import { socket } from './config/socket';

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
      <div className='h-screen w-screen flex items-center justify-center'>
        <LoaderIcon className='h-4 w-4 animate-spin' />
      </div>
    ) : (
      <div className="min-h-screen flex flex-col bg-[#fdfcf7]">
        <Navbar />
        <main className="flex-grow pb-16 sm:pb-8">
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
        </main>
      </div>
    )}
    </BrowserRouter>
  );
}
