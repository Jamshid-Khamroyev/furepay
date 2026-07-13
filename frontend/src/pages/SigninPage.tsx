import  { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { GoogleLogin } from "@react-oauth/google";
import { logo } from '../components/Navbar';

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#fdfcf7]">
      <div className="max-w-md w-full bg-[#fffefb] p-8 border border-amber-200/60 rounded-xl shadow-md">
        <div>
          <h2 className="text-center md:text-3xl text-2xl flex items-center justify-center font-serif font-extrabold tracking-tight text-amber-950">
            <div>Sign in to</div>  
            <img alt='logo' src={logo} className='md:h-28 h-20 md:w-44 w-32'/>
          </h2>
        </div>


        <form className="space-y-4" >
          <div className="space-y-4">
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
              <label htmlFor="email-address" className="block text-sm font-serif font-medium text-amber-900">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-amber-700" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-serif font-medium text-amber-900">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-amber-700" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-serif bg-white text-neutral-900"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              onClick={handleSubmit}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-serif font-semibold rounded-lg text-white bg-amber-900 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 cursor-pointer disabled:bg-neutral-300 transition-colors shadow-sm"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <p className="mt-2 text-center text-sm font-serif text-amber-900">
            Or{' '}
            <Link to="/auth/signup" className="font-semibold text-amber-950 hover:text-amber-700 underline">
              create a new account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
