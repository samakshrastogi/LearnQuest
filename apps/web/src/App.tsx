import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import ParentLayout from './layouts/ParentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import AdminLayout from './layouts/AdminLayout';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import GameMap from './pages/GameMap';
import ReelsFeed from './pages/ReelsFeed';
import Shop from './pages/Shop';
import Inventory from './pages/Inventory';
import ClanPage from './pages/ClanPage';
import TournamentsList from './pages/TournamentsList';
import Leaderboards from './pages/Leaderboards';
import StudentProfilePage from './pages/StudentProfilePage';
import AITutorChat from './pages/AITutorChat';

// Parent pages
import ParentDashboard from './pages/ParentDashboard';

// Teacher pages
import TeacherDashboard from './pages/TeacherDashboard';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminCurriculum from './pages/AdminCurriculum';
import AdminReelTopics from './pages/AdminReelTopics';

// Error pages
import NotFound from './pages/NotFound';

// Route Guards
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { isAuthenticated, user, onboarded, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="mt-4 text-slate-400 font-medium">Restoring Quest Session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!onboarded && window.location.pathname !== '/onboard') {
    return <Navigate to="/onboard" replace />;
  }

  const isSuperAdmin = user.role === 'Super Administrator';
  if (!isSuperAdmin && !allowedRoles.includes(user.role)) {
    if (user.role === 'Student') return <Navigate to="/dashboard" replace />;
    if (user.role === 'Parent') return <Navigate to="/parent/dashboard" replace />;
    if (user.role === 'Teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'Platform Administrator') return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

function App() {
  const { checkSession, loading } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="mt-4 text-slate-400 font-medium">Entering LearnQuest...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboard" element={<Onboarding />} />

        {/* Student RPG Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/game" element={<GameMap />} />
            <Route path="/reels" element={<ReelsFeed />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/clan" element={<ClanPage />} />
            <Route path="/tournaments" element={<TournamentsList />} />
            <Route path="/leaderboard" element={<Leaderboards />} />
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/ai-tutor" element={<AITutorChat />} />
            <Route path="/admin/reels-topics" element={<AdminReelTopics />} />
          </Route>
        </Route>

        {/* Parent Portal Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Parent']} />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
          </Route>
        </Route>

        {/* Teacher Portal Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
          <Route element={<TeacherLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          </Route>
        </Route>

        {/* Platform Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Platform Administrator', 'Super Administrator']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/curriculum" element={<AdminCurriculum />} />
            <Route path="/admin/reels-topics" element={<AdminReelTopics />} />
          </Route>
        </Route>

        {/* 404 handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
