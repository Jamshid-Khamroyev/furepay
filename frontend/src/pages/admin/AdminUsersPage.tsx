import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../api';
import { User } from '../../types';
import { 
  Shield, Mail, Calendar, UserCheck, RefreshCw, Ban, 
  CheckCircle, Search, FileText, MessageCircle, Heart, 
  Award, Clock, Users, AlertCircle, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserWithCount extends User {
  _count?: {
    notes: number;
    blogs: number;
    comments: number;
    likes: number;
  };
}

export default function AdminUsersPage() {
  const { user } = useStore();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState<UserWithCount[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingBlockId, setTogglingBlockId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get('/api/user/all');
      const data = response.data;
      const users = Array.isArray(data) ? data : data.users || [];
      setUsersList(users);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
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
    fetchUsers();
  }, [user, navigate]);

  const handleToggleBlock = async (id: string, isBlocked: boolean, username: string) => {
    const action = isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} @${username}?`)) return;
    setTogglingBlockId(id);
    try {
      await api.patch(`/api/user/${id}/block`, { isBlocked: !isBlocked });
      setUsersList((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isBlocked: !isBlocked } : u))
      );
      toast.success(`${isBlocked ? 'Unblocked' : 'Blocked'} @${username}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setTogglingBlockId(null);
    }
  };

  const getPlanLabel = (plan: string) => {
    return plan || 'FREE';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const filteredUsers = (usersList || []).filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: usersList.length,
    admins: usersList.filter(u => u.role === 'ADMIN').length,
    blocked: usersList.filter(u => u.isBlocked).length,
    active: usersList.filter(u => !u.isBlocked).length,
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
          <p className="text-sm text-neutral-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Users
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage user accounts and permissions</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
            placeholder="Search users..."
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-neutral-600' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600' },
          { label: 'Blocked', value: stats.blocked, icon: Ban, color: 'text-red-600' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-amber-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-semibold text-neutral-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Activity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {getInitials(usr.username)}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">@{usr.username}</p>
                          {usr.bio && (
                            <p className="text-xs text-neutral-400 truncate max-w-[120px]">{usr.bio}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-neutral-600 text-xs">{usr.email}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        usr.role === 'ADMIN' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {usr.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                        {usr.role || 'USER'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        usr.plan && usr.plan !== 'FREE'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {usr.plan && usr.plan !== 'FREE' && <Award className="h-3 w-3" />}
                        {getPlanLabel(usr.plan || 'FREE')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {usr._count?.blogs || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {usr._count?.comments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {usr._count?.likes || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(usr.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {usr.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600">
                          <Ban className="h-3 w-3" />
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleToggleBlock(usr.id, !!usr.isBlocked, usr.username)}
                        disabled={togglingBlockId === usr.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          usr.isBlocked
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        {togglingBlockId === usr.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin mx-1" />
                        ) : usr.isBlocked ? (
                          'Unblock'
                        ) : (
                          'Block'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-xs text-neutral-400">
        <span>Showing {filteredUsers.length} of {usersList.length} users</span>
        {searchQuery && <span>Filtered by: "{searchQuery}"</span>}
      </div>
    </div>
  );
}