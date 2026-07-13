import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { User as UserIcon, Mail, Book, Check, Key, Calendar, Shield, BadgeCheck, LoaderIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../api';
import { ArrowUpRight, Crown } from "lucide-react";


export default function ProfilePage() {
  const { user, signup } = useStore();
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    if (user.role === 'ADMIN') {
      navigate('/admin/blogs', { replace: true });
      return;
    }
    setUsername(user.username || '');
    setEmail(user.email || '');
    setBio(user.bio || '');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const { data } = await api.patch('/api/user/me', { username, bio })
      if(data.success){
        signup(data.user);
      }
      setSuccess(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const upgradePro = async() => {
    setLoading(true);
    try {
      const res = await api.post("/api/payment/checkout");
      window.location.href = res.data.url;
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="border-b border-amber-200/60 pb-6">
        <h1 className="text-3xl font-serif font-extrabold tracking-tight text-amber-955">Your Account Settings</h1>
        <p className="text-neutral-600 font-serif mt-1">Manage public profile attributes, login details, and biography information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="bg-[#fffefb] border border-amber-200/60 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-3">
            {user.avatar ? (
              <div className="h-16 w-16 bg-amber-900 text-white rounded-full flex items-center justify-center font-bold text-2xl font-sans">
                <img src={user.avatar} alt={user.username} className='rounded-full' />
              </div>
            ) : (
            <div className="h-16 w-16 bg-amber-900 text-white rounded-full flex items-center justify-center font-bold text-2xl font-sans">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            )}
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-950">@{user?.username || 'user'}</h3>
              <p className="text-xs font-mono text-neutral-500">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}</p>
            </div>
          </div>

          <div className="border-t border-amber-100 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">Role</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-105 text-amber-900 border border-amber-200/40">
                {user?.role || 'user'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">User Plan</span>
              <span className="text-amber-900 text-sm font-semibold font-mono truncate max-w-[140px]">{user.plan || 'FREE'}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">Email</span>
              <span className="text-amber-900 font-medium truncate max-w-[210px]">{user?.email || '—'}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">User ID</span>
              <span className="text-amber-900/60 text-[10px] font-mono truncate max-w-[216px]">{user?.id || '—'}</span>
            </div>
            
            {user.plan !== 'PREMIUM' && (
              <button
                onClick={upgradePro}
                className="group flex items-center cursor-pointer! gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 w-full py-3 font-medium text-amber-900 transition-all duration-200 hover:border-amber-400 hover:bg-amber-100"
              >
                <div className="rounded-lg bg-amber-500 p-2 text-white">
                  {loading ? <LoaderIcon className='h-4 w-4 animate-spin'/> : <Crown className="h-4 w-4" />}
                </div>
              
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    Upgrade to Pro
                  </p>
                  <p className="text-xs text-amber-700">
                    Unlock all premium features
                  </p>
                </div>
              
                <ArrowUpRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-[#fffefb] border border-amber-200/60 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h2 className="text-xl font-serif font-bold tracking-tight text-amber-950 border-b border-amber-100 pb-4">
            Edit Public Profile
          </h2>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-start space-x-2 text-sm animate-fade-in">
              <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-serif font-medium text-amber-950">
                Username
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-amber-700" />
                </div>
                <input
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-serif font-medium text-amber-950">
                Email address
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-amber-700" />
                </div>
                <input
                  type="email"
                  id="email"
                  disabled
                  value={email}
                  className="block w-full pl-9 pr-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 text-amber-700/60 text-sm font-serif cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-amber-700/40 font-serif">Email address cannot be changed</p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-serif font-medium text-amber-950">
                Profile Biography
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none">
                  <Book className="h-4 w-4 text-amber-700" />
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-amber-100">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-sm font-serif font-semibold cursor-pointer disabled:bg-neutral-300 transition-colors shadow-sm"
              >
                {submitting ? 'Saving changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}