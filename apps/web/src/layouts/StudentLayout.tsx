import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Gamepad2,
  PlaySquare,
  ShoppingBag,
  Briefcase,
  Shield,
  Trophy,
  BarChart3,
  User,
  Sparkles,
  LogOut,
  Menu,
  X,
  Zap,
  Coins,
  Gem,
  Flame,
  Globe,
  ShieldCheck
} from 'lucide-react';

export default function StudentLayout() {
  const { user, profile, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const navItems = [
    { label: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('adventureGame'), path: '/game', icon: Gamepad2 },
    { label: t('learningReels'), path: '/reels', icon: PlaySquare },
    { label: t('ai-tutor') || 'AI Tutor', path: '/ai-tutor', icon: Sparkles },
    { label: t('rewardsStore'), path: '/shop', icon: ShoppingBag },
    { label: t('inventory') || 'Inventory', path: '/inventory', icon: Briefcase },
    { label: t('clans'), path: '/clan', icon: Shield },
    { label: t('tournaments'), path: '/tournaments', icon: Trophy },
    { label: t('leaderboard'), path: '/leaderboard', icon: BarChart3 },
    { label: t('profile'), path: '/profile', icon: User },
    { label: 'Admin Page', path: '/admin/reels-topics', icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const level = profile ? Math.floor(profile.xp / 1000) + 1 : 1;
  const xpInCurrentLevel = profile ? profile.xp % 1000 : 0;

  return (
    <div className="min-h-screen bg-background flex text-slate-200">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/80 border-r border-slate-800 backdrop-blur-md fixed h-full top-0 left-0 z-20">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent tracking-tight font-sans">
              LearnQuest
            </span>
            <span className="bg-amber-500/10 text-accent-gold text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-amber-500/20">
              India
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-accent-gold border-l-4 border-accent-gold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-accent-gold' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold transition-all"
          >
            <LogOut className="h-5 w-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="bg-slate-900/50 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-10 w-full px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-slate-300 hover:text-slate-100 focus:outline-none"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Level and Title summary */}
            {profile && (
              <div className="hidden sm:flex items-center gap-3 bg-slate-950/40 px-4 py-1.5 rounded-2xl border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-md">
                  {level}
                </div>
                <div>
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">LEVEL</h4>
                  <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-0.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full"
                      style={{ width: `${xpInCurrentLevel / 10}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          {profile && (
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Energy */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                <span className="font-bold text-sm">{profile.energy}</span>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Coins className="h-5 w-5 text-accent-gold fill-accent-gold" />
                <span className="font-bold text-sm">{profile.coins}</span>
              </div>

              {/* Gems */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Gem className="h-5 w-5 text-accent-violet fill-accent-violet" />
                <span className="font-bold text-sm">{profile.gems}</span>
              </div>

              {/* Streaks */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-bounce-slow" />
                <span className="font-bold text-sm">{profile.streakCount}</span>
              </div>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700/50 text-xs font-bold transition-all"
              >
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                {i18n.language === 'en' ? 'हिन्दी' : 'English'}
              </button>
            </div>
          )}
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-30 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-slate-900 z-40 lg:hidden flex flex-col p-6 border-r border-slate-800"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-black bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                  LearnQuest
                </span>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-6 w-6 text-slate-400 hover:text-slate-200" />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                        isActive
                          ? 'bg-amber-500/20 text-accent-gold border-l-4 border-accent-gold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-bold transition-all border-t border-slate-800 mt-4"
              >
                <LogOut className="h-5 w-5" />
                {t('logout')}
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
