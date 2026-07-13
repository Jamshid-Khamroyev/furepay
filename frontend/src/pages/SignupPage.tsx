import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#fdfcf7]">
      <div className="max-w-md w-full space-y-6 bg-[#fffefb] p-8 border border-amber-200/60 rounded-xl shadow-md">
        <div>
          <h2 className="text-center text-3xl font-serif font-extrabold tracking-tight text-amber-955">
            Create an account
          </h2>

          <p className="mt-2 text-center text-sm font-serif text-amber-900">
            Or{" "}
            <Link
              to="/auth/signin"
              className="font-semibold text-amber-955 hover:text-amber-700 underline"
            >
              sign in with your existing account
            </Link>
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <GoogleLogin
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
              onSuccess={(response) => {
                if (!response.credential) return;

                handleSuccess(response.credential);
              }}
              onError={() => {
                toast.error("Google login failed");
              }}
            />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-serif font-medium text-amber-900"
            >
              Email address
            </label>

            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-amber-700" />
              </div>

              <input
                id="email"
                type="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-10 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900 disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-serif font-medium text-amber-900"
            >
              Username
            </label>

            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-amber-700" />
              </div>

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
                className="block w-full pl-10 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900 disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-serif font-medium text-amber-900"
            >
              Password
            </label>

            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-amber-700" />
              </div>

              <input
                id="password"
                type="password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900 disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 rounded-lg bg-amber-900 hover:bg-amber-800 text-white font-serif font-semibold transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}