import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../api';
import { User } from '../../types';
import {
  RefreshCw, Search, FileText, MessageCircle, Heart,
  Award, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '../../components/Navbar';

interface UserWithCount extends User {
  _count?: {
    notes: number;
    blogs: number;
    comments: number;
    likes: number;
  };
}

const GRID_COLS = 'md:grid-cols-[minmax(0,2.4fr)_88px_118px_104px_150px_120px_96px]';

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-muted" />
          <p className="font-mono text-[13px] text-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  const RolePill = ({ role }: { role?: string }) => (
    <span
      className={`inline-flex items-center rounded-md px-2 py-[3px] font-mono text-[11px] font-semibold ${
        role === 'ADMIN' ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-2'
      }`}
    >
      {role || 'USER'}
    </span>
  );

  const PlanPill = ({ plan }: { plan?: string }) => {
    const premium = !!plan && plan !== 'FREE';
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-[3px] font-mono text-[11px] font-semibold ${
          premium ? 'bg-accent-soft text-accent-ink' : 'bg-surface-2 text-ink-2'
        }`}
      >
        {premium && <Award className="h-3 w-3" />}
        {getPlanLabel(plan || 'FREE')}
      </span>
    );
  };

  const Status = ({ blocked }: { blocked?: boolean }) => (
    <span className="inline-flex items-center gap-2 text-[13px] text-ink">
      <span className={`h-[7px] w-[7px] rounded-full ${blocked ? 'bg-danger' : 'bg-success'}`} />
      {blocked ? 'Blocked' : 'Active'}
    </span>
  );

  const Activity = ({ u }: { u: UserWithCount }) => (
    <span className="inline-flex items-center gap-3 font-mono text-[12px] text-muted">
      <span className="inline-flex items-center gap-1" title="Articles">
        <FileText className="h-3 w-3" />
        {u._count?.blogs || 0}
      </span>
      <span className="inline-flex items-center gap-1" title="Comments">
        <MessageCircle className="h-3 w-3" />
        {u._count?.comments || 0}
      </span>
      <span className="inline-flex items-center gap-1" title="Likes">
        <Heart className="h-3 w-3" />
        {u._count?.likes || 0}
      </span>
    </span>
  );

  const ActionButton = ({ u, block }: { u: UserWithCount; block?: boolean }) => {
    return (
      <button
        onClick={() => handleToggleBlock(u.id, !!u.isBlocked, u.username)}
        disabled={togglingBlockId === u.id}
        className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-3 text-[13px] font-semibold transition-[transform,opacity] hover:opacity-85 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
          block ? 'h-11 min-w-[88px]' : 'h-8 min-w-[72px]'
        } ${u.isBlocked ? 'bg-surface-2 text-ink' : 'bg-danger-soft text-danger'}`}
      >
        {togglingBlockId === u.id ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : u.isBlocked ? (
          'Unblock'
        ) : (
          'Block'
        )}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 md:px-16 md:pt-12">
      {/* Intro */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Admin · Users</p>
          <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-[-0.01em] text-ink md:text-[44px]">Users</h1>
          <p className="mt-1 text-[15px] text-ink-2">Manage user accounts and permissions</p>
        </div>

        <div className="relative w-full md:w-[340px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3.5 text-[14px] text-ink placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 md:h-[42px] md:rounded-lg"
            placeholder="Search users..."
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[12px] text-muted">
        <span><span className="font-semibold text-ink">{stats.total}</span> total</span>
        <span><span className="font-semibold text-ink">{stats.active}</span> active</span>
        <span><span className="font-semibold text-ink">{stats.blocked}</span> blocked</span>
        <span><span className="font-semibold text-ink">{stats.admins}</span> admins</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {/* Desktop header */}
        <div className={`hidden items-center gap-4 bg-surface-2 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted md:grid ${GRID_COLS}`}>
          <span>User</span>
          <span>Role</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Activity</span>
          <span>Joined</span>
          <span className="text-right">Action</span>
        </div>

        {filteredUsers.length > 0 ? (
          <ul>
            {filteredUsers.map((usr, idx) => (
              <li key={usr.id} className={idx === 0 ? 'max-md:border-t-0 border-t border-line' : 'border-t border-line'}>
                {/* Desktop row */}
                <div className={`hidden items-center gap-4 px-5 py-3.5 md:grid ${GRID_COLS}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={usr.username} src={usr.avatar} size={32} />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-ink">@{usr.username}</p>
                      <p className="truncate font-mono text-[12px] text-muted">{usr.email}</p>
                    </div>
                  </div>
                  <div>{RolePill({ role: usr.role })}</div>
                  <div>{PlanPill({ plan: usr.plan })}</div>
                  <div>{Status({ blocked: usr.isBlocked })}</div>
                  <div>{Activity({ u: usr })}</div>
                  <span className="font-mono text-[13px] text-ink-2">{usr.createdAt ? formatDate(usr.createdAt) : '—'}</span>
                  <div className="text-right">{ActionButton({ u: usr })}</div>
                </div>

                {/* Phone row */}
                <div className="flex items-center gap-3 px-4 py-4 md:hidden">
                  <Avatar name={usr.username} src={usr.avatar} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">@{usr.username}</p>
                    <p className="truncate font-mono text-[12px] text-muted">{usr.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {RolePill({ role: usr.role })}
                      {PlanPill({ plan: usr.plan })}
                      {Status({ blocked: usr.isBlocked })}
                    </div>
                  </div>
                  {ActionButton({ u: usr, block: true })}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-t border-line px-5 py-14 text-center max-md:border-t-0">
            <AlertCircle className="mx-auto mb-2 h-7 w-7 text-line-strong" />
            <p className="text-[14px] text-muted">No users found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-4 font-mono text-[12px] text-muted">
        <span>Showing {filteredUsers.length} of {usersList.length} users</span>
        {searchQuery && <span className="truncate">Filtered by: "{searchQuery}"</span>}
      </div>
    </div>
  );
}
