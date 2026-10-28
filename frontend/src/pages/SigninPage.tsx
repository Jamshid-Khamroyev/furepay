import  { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Mail, Lock, BookOpen, StickyNote, Radio, PenLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { GoogleLogin } from "@react-oauth/google";
import { Logo, ThemeToggle } from '../components/Navbar';

const fieldClass =
  'block h-[52px] w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3.5 text-[15px] text-ink placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted md:h-11 md:rounded-lg';

function AuthAside() {
  return (
    <aside className="hidden w-[600px] shrink-0 flex-col justify-between bg-ink p-14 lg:flex">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-accent text-on-accent">
          <PenLine className="h-[15px] w-[15px]" strokeWidth={2.25} />
        </span>
        <span className="font-serif text-[23px] font-semibold leading-none tracking-[-0.02em] text-bg">furepay</span>
      </Link>
      <div className="space-y-10">
        <p className="font-serif text-[38px] leading-tight text-bg">
          Write long-form articles, drop quick notes, and watch every like and comment arrive in real time.
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { icon: BookOpen, label: 'Blogs' },
            { icon: StickyNote, label: 'Notes' },
            { icon: Radio, label: 'Live updates' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 text-[14px] text-line-strong">
              <Icon className="h-4 w-4 text-accent" />
              {label}
            </span>
          ))}
        </div>
      </div>
      <p className="font-mono text-[12px] text-muted">© 2026 FurePay</p>
    </aside>
  );
}

export default function SigninPage() {
  const [email, setEmail] = useState('');
  const { signup } = useStore()
  const [password, setPassword] = useState('');
  const { user } = useStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/blogs');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!email || !password) return toast.error('Please fill in all fields.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/signin', { email, password });
      if(data.success){
        signup(data.user);
      }
    } catch (err) {
      toast.error(err.response.data.message)
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccess = async (credential: string) => {
    setSubmitting(true);
    try {
      const { data } = await api.post( "/api/auth/google", { credential });
      if (data.success) {
        console.log("Google login successful:", data.user);
        signup(data.user);
      } else {
        toast.error(data.message || "Google login failed.");
      }
    } catch (error) {
      toast.error("Google login failed");
    } finally {
      setSubmitting(false)
    }
  };

  const altLink = (
    <p className="text-center text-[14px] text-ink-2">
      New here?{' '}
      <Link to="/auth/signup" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">
        Create an account
      </Link>
    </p>
  );

  return (
    <div className="flex min-h-dvh bg-bg">
      <AuthAside />

      <div className="flex min-h-dvh flex-1 flex-col">
        <div className="flex items-center justify-between px-6 pt-5 lg:justify-end lg:px-8 lg:pt-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px] px-6 py-10">
            <h1 className="font-serif text-[34px] leading-tight tracking-[-0.01em] text-ink md:text-[40px]">
              Sign in to furepay
            </h1>
            <p className="mt-2 text-[15px] text-ink-2">Welcome back. Pick up where you left off.</p>

            <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="flex justify-center">
                <GoogleLogin
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="continue_with"
                  onSuccess={(response) => {
                    if (!response.credential) return;

                    handleSuccess(response.credential);
                  }}
                  onError={() => {
                    toast.error("Google login failed");
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">or with email</span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <div>
                <label htmlFor="email-address" className="mb-1.5 block text-[13px] font-medium text-ink-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClass}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink text-[15px] font-semibold text-bg transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 md:h-12"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 hidden lg:block">{altLink}</div>
          </div>
        </div>

        <div className="px-6 pb-8 pt-2 lg:hidden">{altLink}</div>
      </div>
    </div>
  );
}
