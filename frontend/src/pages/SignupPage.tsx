import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Mail, Lock, User as UserIcon, BookOpen, StickyNote, Radio, PenLine, Loader2 } from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { Logo, ThemeToggle } from "../components/Navbar";

const avatarStyles = [
  "adventurer",
  "personas",
  "bottts",
  "pixel-art",
  "thumbs",
];

const generateAvatar = (seed: string) => {
  const style =
    avatarStyles[Math.floor(Math.random() * avatarStyles.length)];

  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(
    seed
  )}`;
};

const fieldClass =
  "block h-[52px] w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3.5 text-[15px] text-ink placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted md:h-11 md:rounded-lg";

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
            { icon: BookOpen, label: "Blogs" },
            { icon: StickyNote, label: "Notes" },
            { icon: Radio, label: "Live updates" },
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

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [isUsernameEdited, setIsUsernameEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signup, user } = useStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === "ADMIN" ? "/admin/blogs" : "/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isUsernameEdited) return;

    const generated = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    setUsername(generated);
  }, [email, isUsernameEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const avatar = generateAvatar(username);

      const { data } = await api.post("/api/auth/signup", {
        username,
        email,
        password,
        avatar,
      });

      if (data.success) {
        signup(data.user);
        toast.success("Account created successfully!");
      } else {
        toast.error(data.message || "Failed to sign up.");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Failed to register. Username or email might be taken."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccess = async (credential: string) => {
    setSubmitting(true)
    try {
      const { data } = await api.post( "/api/auth/google", { credential });
      if (data.success) {
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
      Already have an account?{" "}
      <Link
        to="/auth/signin"
        className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent"
      >
        Sign In
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
              Join furepay
            </h1>
            <p className="mt-2 text-[15px] text-ink-2">Free plan: 5 articles, unlimited notes.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                <label htmlFor="username" className="mb-1.5 block text-[13px] font-medium text-ink-2">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="username"
                    type="text"
                    required
                    disabled={submitting}
                    value={username}
                    onChange={(e) => {
                      setIsUsernameEdited(true);
                      setUsername(e.target.value);
                    }}
                    placeholder="johndoe"
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
                    id="email"
                    type="email"
                    required
                    disabled={submitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={fieldClass}
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
                    type="password"
                    required
                    disabled={submitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={fieldClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink text-[15px] font-semibold text-bg transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 md:h-12"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Creating account..." : "Create account"}
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
