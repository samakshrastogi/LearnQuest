import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ShieldAlert, Sparkles, Eye, EyeOff, Check, X, User, Lock, Mail, Building } from 'lucide-react';
import { UserRole } from '@learnquest/shared-types';

export default function Register() {
  const { register, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Student');
  const [schoolCode, setSchoolCode] = useState('');
  const [validationError, setValidationError] = useState('');

  // Interactive Guruji advisor hints
  const [gurujiHint, setGurujiHint] = useState("Namaste! Create your unique questor profile to begin your adventure! 🌟");

  // Live password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber;

  useEffect(() => {
    if (validationError || error) {
      setGurujiHint("Oops! Check your details above. Make sure your password has uppercase, lowercase & numbers! ⚠️");
    }
  }, [validationError, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!username || !password) {
      setValidationError('Username and Password are required.');
      return;
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters long.');
      return;
    }

    if (!isPasswordValid) {
      setValidationError('Password must be at least 8 characters long and contain uppercase, lowercase, and a number.');
      return;
    }

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/5 rounded-full filter blur-3xl -z-10 animate-pulse" />
      <div className="absolute w-[300px] h-[300px] bg-cyan-500/5 rounded-full filter blur-3xl -z-10 bottom-10 right-10" />

      <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-center z-10">

        {/* Left Side: Interactive Guruji Mascot and Speech Bubble */}
        <div className="md:col-span-5 flex flex-col items-center gap-4 text-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-cyan-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-all duration-700 animate-spin" style={{ animationDuration: '10s' }} />
            <div className="relative bg-slate-950 border border-slate-800 h-32 w-32 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
              <svg viewBox="0 0 100 100" className="h-24 w-24">
                <defs>
                  <linearGradient id="wizardGradReg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="35" fill="#fef08a" />
                <path d="M25,55 C25,75 75,75 75,55 Z" fill="#f8fafc" />
                <circle cx="42" cy="45" r="4" fill="#0f172a" />
                <circle cx="58" cy="45" r="4" fill="#0f172a" />
                <path d="M38,53 C45,56 55,56 62,53" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M15,35 L50,5 L85,35 Z" fill="url(#wizardGradReg)" />
                <path d="M10,35 L90,35" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                <circle cx="50" cy="20" r="2" fill="#ffffff" />
                <circle cx="35" cy="25" r="1.5" fill="#ffffff" />
                <circle cx="65" cy="25" r="1.5" fill="#ffffff" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <Sparkles className="h-3 w-3 fill-slate-950" /> Guruji
            </div>
          </div>

          <div className="relative bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm shadow-xl flex flex-col gap-1.5 animate-bounce" style={{ animationDuration: '4s' }}>
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Guruji says:</span>
            <p className="text-sm font-medium text-slate-200 leading-relaxed font-sans">{gurujiHint}</p>
          </div>
        </div>

        {/* Right Side: Registration Card */}
        <div className="md:col-span-7 w-full">
          <div className="glass-card p-8 flex flex-col gap-6 shadow-2xl relative">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                <Sparkles className="h-7 w-7 text-accent-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight font-sans">Begin Your Quest</h1>
                <p className="text-sm text-slate-400">Create your account to unlock educational games</p>
              </div>
            </div>

            {/* Validation Errors */}
            {(validationError || error) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm">
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
                        setGurujiHint(`Awesome! Registering as a ${r}. Fill in your details below! 🎮`);
                      }}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        role === r
                          ? 'bg-amber-500/15 border-accent-gold text-accent-gold shadow-lg shadow-amber-500/10'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-500" /> Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  onFocus={() => setGurujiHint("Pick a unique hero username! Only letters, numbers, and underscores allowed. 🛡️")}
                  className="glass-input text-base py-3"
                  placeholder="e.g. aarav_questor"
                />
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-cyan-500" /> Email {role === 'Student' && '(Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setGurujiHint("Enter your email address so we can send your welcome scroll! 📧")}
                  className="glass-input text-base py-3"
                  placeholder="e.g. student@school.edu.in"
                />
              </div>

              {/* Password Input with Show/Hide toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setGurujiHint("Make a strong secret password! Include uppercase letters and numbers. 🔐")}
                    className="glass-input w-full pr-12 text-base py-3"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Live Password Checklist Badges */}
                <div className="grid grid-cols-2 gap-1.5 mt-1 text-[11px] font-medium text-slate-400">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasUpper ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    <span>1 Uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasLower ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    <span>1 Lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasNumber ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    <span>1 Number (0-9)</span>
                  </div>
                </div>
              </div>

              {/* School Code (Optional for Students/Teachers) */}
              {(role === 'Student' || role === 'Teacher') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-purple-400" /> School Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    onFocus={() => setGurujiHint("Have a code from your school? Enter it to auto-join your class! 🏫")}
                    className="glass-input text-base py-3"
                    placeholder="e.g. DPSRKP"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full mt-2 font-bold py-3.5 text-base flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 fill-slate-950" />
                    <span>Create Account & Onboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-sm text-slate-400 border-t border-slate-800 pt-5">
              Already registered?{' '}
              <Link to="/login" className="text-accent-gold font-bold hover:underline">
                Login here
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
