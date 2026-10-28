import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { User as UserIcon, Mail, Check, Lock, LoaderIcon, Crown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../api';
import { Avatar } from '../components/Navbar';

const fieldClass =
  'block h-[52px] w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3.5 text-[15px] text-ink placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 md:h-11 md:rounded-lg';

function FactRow({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3">
      <span className="text-[13px] text-muted">{label}</span>
      <span title={title} className="min-w-0 truncate font-mono text-[13px] font-medium text-ink">
        {value}
      </span>
    </div>
  );
}

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-[3px] text-accent-ink">
      <Crown className="h-3.5 w-3.5" />
      <span className="font-mono text-[11px] font-semibold tracking-[0.08em]">PREMIUM</span>
    </span>
  );
}

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

  const isPremium = user.plan === 'PREMIUM';
  const planLabel = user.plan || 'FREE';

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-8 md:px-24 md:pt-14 animate-fade-in">
      <header className="mb-8 md:mb-12">
        <h1 className="font-serif text-[32px] leading-tight tracking-[-0.01em] text-ink md:text-[48px]">
          Your Account Settings
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] text-ink-2">
          Manage public profile attributes, login details, and biography information.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_1fr] lg:gap-12">
        <div className="space-y-4 lg:space-y-6">
          {/* Phone: compact identity row */}
          <div className="flex items-center gap-3.5 lg:hidden">
            <Avatar name={user.username} src={user.avatar} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-serif text-[20px] leading-tight text-ink">{user.username || 'user'}</p>
                {isPremium && <Crown className="h-4 w-4 shrink-0 text-accent" />}
              </div>
              <p className="truncate font-mono text-[12px] text-muted">
                {user.email || '—'} · {planLabel}
              </p>
            </div>
          </div>

          {/* Desktop: identity panel */}
          <section className="hidden rounded-[14px] border border-line bg-surface p-7 lg:block">
            <div className="flex items-center gap-4 pb-5">
              <Avatar name={user.username} src={user.avatar} size={64} />
              <div className="min-w-0">
                <h2 className="truncate font-serif text-[24px] leading-tight text-ink">{user.username || 'user'}</h2>
                <p className="truncate text-[14px] text-muted">{user.email || '—'}</p>
              </div>
            </div>
            {isPremium && (
              <div className="pb-4">
                <PremiumBadge />
              </div>
            )}
            <FactRow label="Role" value={user.role || 'USER'} />
            <FactRow label="Plan" value={planLabel} />
            {user.createdAt && (
              <FactRow
                label="Member since"
                value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              />
            )}
            <FactRow label="User ID" value={<span className="block max-w-[200px] truncate">{user.id || '—'}</span>} title={user.id} />
          </section>

          {!isPremium && (
            <>
              {/* Phone: dark row button */}
              <button
                onClick={upgradePro}
                className="flex min-h-[64px] w-full cursor-pointer items-center gap-3.5 rounded-[14px] bg-ink px-4 py-3 text-left transition-transform active:scale-[0.97] lg:hidden"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
                  {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-bg">Upgrade to Pro</span>
                  <span className="block text-[13px] text-line-strong">Unlimited articles and tags</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-line-strong" />
              </button>

              {/* Desktop: upgrade panel */}
              <section className="hidden rounded-[14px] bg-ink p-7 lg:block">
                <div className="flex items-center gap-2 text-accent">
                  <Crown className="h-4 w-4" />
                  <span className="font-mono text-[12px] font-semibold tracking-[0.08em]">PREMIUM</span>
                </div>
                <p className="mt-3 font-serif text-[28px] leading-tight text-bg">Write without limits.</p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    'Unlimited articles (Free: 5)',
                    'Unlimited tags per article (Free: 5)',
                    'Premium badge on your profile',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[14px] text-line-strong">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={upgradePro}
                  className="mt-7 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent text-[15px] font-semibold text-on-accent transition-[transform,opacity] hover:opacity-90 active:scale-[0.97]"
                >
                  {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  Upgrade with Stripe
                </button>
              </section>
            </>
          )}
        </div>

        <section className="rounded-[14px] border border-line bg-surface p-5 md:p-8">
          <h2 className="font-serif text-[24px] leading-tight text-ink">Edit public profile</h2>

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-success-soft px-3.5 py-3 text-[14px] text-success animate-fade-in">
              <Check className="h-4 w-4 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-[13px] font-medium text-ink-2">
                Username
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  id="email"
                  disabled
                  value={email}
                  className="block h-[52px] w-full cursor-not-allowed rounded-xl border border-line bg-surface-2 pl-10 pr-10 text-[15px] text-muted outline-none md:h-11 md:rounded-lg"
                />
                <Lock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
              <p className="mt-1.5 text-[12px] text-muted">Email address cannot be changed</p>
            </div>

            <div>
              <label htmlFor="bio" className="mb-1.5 block text-[13px] font-medium text-ink-2">
                Bio
              </label>
              <textarea
                id="bio"
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="block w-full resize-y rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 md:rounded-lg"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-muted">Changes are visible on your public profile.</p>
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink px-6 text-[15px] font-semibold text-bg transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-auto"
              >
                {submitting && <LoaderIcon className="h-4 w-4 animate-spin" />}
                {submitting ? 'Saving changes...' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
