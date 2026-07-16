import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LayoutDashboard, Settings, LogOut, ShieldAlert } from 'lucide-react';

export default function ParentLayout() {
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
          <span className="text-xl font-bold text-cyan-400">ParentPortal</span>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-500/20">
            India
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/parent/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              location.pathname === '/parent/dashboard'
                ? 'bg-cyan-500/15 text-cyan-400 border-l-4 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
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
            <h2 className="text-sm text-slate-400 font-bold">WELCOME BACK</h2>
            <h1 className="text-lg font-bold text-slate-200">{user?.username}</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <ShieldAlert className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-bold">CHILD MONITOR ACTIVE</span>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
