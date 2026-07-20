import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ShieldAlert, Compass, Eye, EyeOff, Sparkles, HelpCircle, UserCheck, Shield, GraduationCap, Users } from 'lucide-react';

export default function Login() {
  const { login, error, loading, isAuthenticated, user, onboarded } = useAuthStore();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Interactive Guruji advisor hints
  const [gurujiHint, setGurujiHint] = useState("Namaste! Enter your hero credentials to continue the quest! 🔮");

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!onboarded) {
        navigate('/onboard', { replace: true });
      } else if (user.role === 'Student') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'Parent') {
        navigate('/parent/dashboard', { replace: true });
      } else if (user.role === 'Teacher') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, onboarded, navigate]);

  useEffect(() => {
    if (validationError || error) {
      setGurujiHint("Oops! Double-check your credentials. Make sure Caps Lock is off! ⚠️");
    }
  }, [validationError, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanUsername = usernameOrEmail.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    const success = await login(cleanUsername, password);
    if (success) {
      const storeState = useAuthStore.getState();
      const currentUser = storeState.user;
      const currentOnboarded = storeState.onboarded;

      if (!currentOnboarded) {
        navigate('/onboard');
      } else if (currentUser?.role === 'Student') {
        navigate('/dashboard');
      } else if (currentUser?.role === 'Parent') {
        navigate('/parent/dashboard');
      } else if (currentUser?.role === 'Teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }
  };

  // Quick 1-click Demo Account Logins
  const handleQuickLogin = async (demoUsername: string) => {
    setUsernameOrEmail(demoUsername);
    setPassword('password123');
    setGurujiHint(`Logging into ${demoUsername}'s hero account... 🚀`);
    await login(demoUsername, 'password123');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/5 rounded-full filter blur-3xl -z-10 animate-pulse" />
      <div className="absolute w-[300px] h-[300px] bg-cyan-500/5 rounded-full filter blur-3xl -z-10 bottom-10 right-10" />

      <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Interactive Guruji Mascot and Speech Bubble */}
        <div className="md:col-span-5 flex flex-col items-center gap-4 text-center">
          {/* Avatar frame */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-cyan-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-all duration-700 animate-spin" style={{ animationDuration: '10s' }} />
            <div className="relative bg-slate-950 border border-slate-800 h-32 w-32 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
              {/* Styled SVG Wizard Avatar for Guruji */}
              <svg viewBox="0 0 100 100" className="h-24 w-24">
                <defs>
                  <linearGradient id="wizardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                </defs>
                {/* Face */}
                <circle cx="50" cy="50" r="35" fill="#fef08a" />
                {/* Beard */}
                <path d="M25,55 C25,75 75,75 75,55 Z" fill="#f8fafc" />
                {/* Eyes */}
                <circle cx="42" cy="45" r="4" fill="#0f172a" />
                <circle cx="58" cy="45" r="4" fill="#0f172a" />
                {/* Mustache */}
                <path d="M38,53 C45,56 55,56 62,53" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Wizard Hat */}
                <path d="M15,35 L50,5 L85,35 Z" fill="url(#wizardGrad)" />
                <path d="M10,35 L90,35" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                {/* Sparkle details */}
                <circle cx="50" cy="20" r="2" fill="#ffffff" />
                <circle cx="35" cy="25" r="1.5" fill="#ffffff" />
                <circle cx="65" cy="25" r="1.5" fill="#ffffff" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <Sparkles className="h-3 w-3 fill-slate-950" /> Advisor
            </div>
          </div>

          {/* Speech bubble */}
          <div className="relative bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm shadow-xl flex flex-col gap-1.5 animate-bounce" style={{ animationDuration: '4s' }}>
            <div className="absolute top-1/2 -right-3 md:top-auto md:bottom-1/2 md:left-1/2 md:-translate-x-1/2 md:top-full md:border-t-slate-900 border-8 border-transparent md:-translate-y-0 hidden md:block" />
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Guruji says:</span>
            <p className="text-sm font-medium text-slate-200 leading-relaxed font-sans">{gurujiHint}</p>
          </div>
        </div>

        {/* Right Side: Simple & Welcoming Login Card */}
        <div className="md:col-span-7 w-full">
          <div className="glass-card p-8 flex flex-col gap-6 shadow-2xl relative">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                <Compass className="h-7 w-7 text-accent-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight font-sans">Welcome Back, Hero!</h1>
                <p className="text-sm text-slate-400">Continue your learning quest and earn coins</p>
              </div>
            </div>

            {/* Quick 1-Click Demo Accounts */}
            <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> 1-Click Demo Fast Login
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student1')}
                  className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1 transition-all"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-amber-400" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('parent1')}
                  className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1 transition-all"
                >
                  <Users className="h-3.5 w-3.5 text-cyan-400" /> Parent
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('teacher1')}
                  className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1 transition-all"
                >
                  <Shield className="h-3.5 w-3.5 text-purple-400" /> Teacher
                </button>
              </div>
            </div>

            {/* Form Errors */}
            {(validationError || error) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p>{validationError || error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Username Input */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Username or Email</label>
                  <span className="text-[10px] text-slate-500">Case doesn't matter!</span>
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  onFocus={() => setGurujiHint("Type your unique hero name! Don't worry about capital letters. 📝")}
                  className="glass-input text-lg py-3.5 focus:border-amber-500/50"
                  placeholder="e.g. aarav12 or student1"
                  autoFocus
                />
              </div>

              {/* Password Input with Show/Hide toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setGurujiHint("Type your password carefully. Click the eye icon to see what you write! 🤫")}
                    className="glass-input w-full pr-12 text-lg py-3.5 focus:border-cyan-500/50"
                    placeholder="••••••••"
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
              </div>

              {/* Enter Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full mt-3 font-bold py-4 text-base flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 fill-slate-950" />
                    <span>Enter Kingdom</span>
                  </>
                )}
              </button>
            </form>

            {/* Child-friendly helpful hints */}
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/60 flex gap-2.5 items-start">
              <HelpCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200 block mb-0.5">Need help logging in?</strong>
                Bhool gaye? If you forgot your code or password, ask your Parent or Teacher to look it up in their dashboard!
              </div>
            </div>

            <div className="text-center text-sm text-slate-400 border-t border-slate-800 pt-6">
              New questor?{' '}
              <Link to="/register" className="text-accent-gold font-bold hover:underline">
                Create an Account
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
