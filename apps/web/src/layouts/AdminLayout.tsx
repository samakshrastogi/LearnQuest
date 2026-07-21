import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { ShieldCheck, LayoutDashboard, Database, LogOut, BookOpen } from 'lucide-react';

export default function AdminLayout() {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-amber-500" />
          <span className="text-xl font-extrabold text-amber-500">PlatformAdmin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              location.pathname === '/admin/dashboard'
                ? 'bg-amber-500/15 text-amber-500 border-l-4 border-amber-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            System Status
          </Link>
          <Link
            to="/admin/reels-topics"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              location.pathname === '/admin/reels-topics'
                ? 'bg-amber-500/15 text-amber-500 border-l-4 border-amber-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="h-5 w-5 text-amber-400" />
            Class 1-5 Topics
          </Link>
          <Link
            to="/admin/curriculum"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              location.pathname === '/admin/curriculum'
                ? 'bg-amber-500/15 text-amber-500 border-l-4 border-amber-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="h-5 w-5" />
            Curriculum Builder
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/15 font-semibold transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs text-slate-400 font-bold uppercase tracking-widest font-sans">SUPERADMIN SECURITY SHIELD</h2>
            <h1 className="text-lg font-bold text-slate-200">{user?.username}</h1>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
