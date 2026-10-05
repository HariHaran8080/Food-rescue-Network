import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate(data.user.role === 'DONOR' ? '/donor/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -mt-8 px-4">
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-panel animate-scale-in border border-rescue-500/30 bg-white">

        {/* Left — brand panel */}
        <div className="hidden md:flex flex-col justify-between w-5/12 p-10 relative overflow-hidden bg-rescue-50 border-r border-rescue-500/20">
          {/* Logo */}
          <div className="relative">
            <Link to="/" className="flex items-center gap-3 mb-10 group">
              <img
                src="/logo.png"
                alt="Food Rescue Logo"
                className="h-11 w-auto object-contain"
              />
              <span className="font-black text-xl tracking-tight text-gray-900 font-display">
                Food<span className="text-[#387B85]">Rescue</span>
                <span className="text-[#92C7CF]">.</span>
              </span>
            </Link>

            <h2 className="text-2xl font-extrabold text-surface-50 mb-3 leading-snug">
              Good food<br />shouldn't go<br />to waste
            </h2>
            <p className="text-sm text-surface-400 leading-relaxed font-medium">
              Join donors and receivers working together to rescue surplus food across local communities.
            </p>
          </div>

          {/* Feature list */}
          <div className="relative space-y-3">
            {[
              {
                icon: (
                  <svg className="w-4 h-4 text-rescue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
                text: 'Real-time food listings',
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-rescue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                text: 'Location-based matching',
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-rescue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                text: 'Instant claim notifications',
              },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-white border border-rescue-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {item.icon}
                </span>
                <span className="text-sm text-surface-50 font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 bg-white p-8 md:p-10">
          <div className="max-w-sm mx-auto">
            <h1 className="text-2xl font-extrabold text-surface-50 mb-1">Welcome back</h1>
            <p className="text-sm text-surface-400 mb-8 font-medium">Sign in to continue rescuing food</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-surface-50 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-dark w-full px-4 py-3 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-50 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-dark w-full px-4 py-3 pr-10 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-50 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-rose-700 text-sm font-bold">{error}</span>
                </div>
              )}

              <button
                id="login-submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 rounded-lg text-sm font-bold inline-flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Signing in…' : 'Sign In'}</span>
                {!loading && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-rescue-500/20 space-y-3">
              <p className="text-sm text-surface-400 text-center font-medium">
                No account?{' '}
                <Link to="/register" className="text-rescue-700 font-extrabold hover:text-rescue-900 transition-colors">
                  Create one free
                </Link>
              </p>
              <div className="bg-rescue-50 rounded-xl p-3 border border-rescue-500/20">
                <p className="text-xs text-surface-400 text-center font-medium">
                  Demo — Donor:{' '}
                  <button
                    type="button"
                    onClick={() => { setEmail('donor@greentable.com'); setPassword('password123'); }}
                    className="text-rescue-700 font-bold hover:underline"
                  >
                    donor@greentable.com
                  </button>
                  {' / '}Receiver:{' '}
                  <button
                    type="button"
                    onClick={() => { setEmail('receiver@hopeshelter.org'); setPassword('password123'); }}
                    className="text-rescue-700 font-bold hover:underline"
                  >
                    receiver@hopeshelter.org
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
