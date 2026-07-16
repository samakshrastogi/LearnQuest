import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ShieldAlert, Compass } from 'lucide-react';

export default function Login() {
  const { login, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!usernameOrEmail || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    const success = await login(usernameOrEmail, password);
    if (success) {
      const storeState = useAuthStore.getState();
      const user = storeState.user;
      const onboarded = storeState.onboarded;

      if (!onboarded) {
        navigate('/onboard');
      } else if (user?.role === 'Student') {
        navigate('/dashboard');
      } else if (user?.role === 'Parent') {
        navigate('/parent/dashboard');
      } else if (user?.role === 'Teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      {/* Background radial glow */}
      <div className="absolute w-[400px] h-[400px] bg-amber-500/5 rounded-full filter blur-3xl -z-10" />

      <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <Compass className="h-10 w-10 text-accent-gold" />
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">Welcome Back</h1>
          <p className="text-sm text-slate-400">Continue your educational quest</p>
        </div>

        {/* Form Errors */}
        {(validationError || error) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>{validationError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username or Email</label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="glass-input"
              placeholder="e.g. aarav"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full mt-2 font-bold py-3.5 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
            ) : (
              'Enter Kingdom'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400 border-t border-slate-800 pt-6">
          New questor?{' '}
          <Link to="/register" className="text-accent-gold font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
