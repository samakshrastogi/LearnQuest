import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { UserRole } from '@learnquest/shared-types';

export default function Register() {
  const { register, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [schoolCode, setSchoolCode] = useState('');
  
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!username || !password) {
      setValidationError('Username and Password are required.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    // Call register
    const success = await register({
      username,
      email: email || undefined,
      password,
      role,
      schoolInvitationCode: schoolCode || undefined,
    });

    if (success) {
      navigate('/onboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-md glass-card p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <Sparkles className="h-10 w-10 text-accent-gold" />
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">Begin Quest</h1>
          <p className="text-sm text-slate-400">Join the educational RPG system</p>
        </div>

        {/* Validation Errors */}
        {(validationError || error) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>{validationError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Role selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose Your Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Student', 'Parent', 'Teacher'] as UserRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setValidationError('');
                  }}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                    role === r
                      ? 'bg-amber-500/15 border-accent-gold text-accent-gold'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              className="glass-input"
              placeholder="e.g. aarav123"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email (Optional for Students)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="e.g. name@domain.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="Min. 8 characters"
            />
          </div>

          {/* School Code (Optional for Students/Teachers) */}
          {(role === 'Student' || role === 'Teacher') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                School Code (Optional)
              </label>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                className="glass-input"
                placeholder="e.g. DPSRKP"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full mt-2 font-bold py-3.5 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
            ) : (
              'Claim Inventory & Start'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400 border-t border-slate-800 pt-6">
          Already registered?{' '}
          <Link to="/login" className="text-accent-gold font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
