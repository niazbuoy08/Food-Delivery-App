import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuth } from './AuthContext';
import { errorMessage } from '../lib/api';
import Brandmark from '../components/Brandmark';

export default function AdminLogin() {
  const { admin, checking, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (checking) return <div className="min-h-screen bg-ink-900" />;
  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Brandmark size={48} />
          <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-50">
            Bistro Lumière
          </h1>
          <p className="mt-1.5 text-sm text-ink-400">Sign in to manage orders and la carte.</p>
        </div>

        <form onSubmit={submit} className="mt-8 rounded-2xl bg-white p-6 shadow-lift">
          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bistrolumiere.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2.5 text-ink-400 hover:text-ink-800"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary btn-lg mt-6 w-full">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          <Link to="/" className="hover:text-ink-50">← Back to the restaurant site</Link>
        </p>
      </div>
    </div>
  );
}
