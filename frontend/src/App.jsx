import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import { Sparkles, LogOut, User as UserIcon, Target, Shield, CheckCircle2 } from 'lucide-react';
import { APP_NAME } from './utils/constants';

// Placeholder Dashboard component protected by Auth
function DashboardPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col justify-between p-6 md:p-12 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-indigo/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">{APP_NAME}</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <UserIcon className="w-4 h-4 text-brand-cyan" />
            <span className="text-slate-300 font-semibold">{user?.full_name}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-all"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Dashboard Protected Content Card */}
      <main className="max-w-4xl mx-auto w-full my-12 z-10">
        <div className="glass-panel p-8 md:p-12 border border-slate-800/90 relative">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 mb-6">
            <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
            <span className="text-xs font-mono text-emerald-300">Phase 2 Authenticated Session Active</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Candidate Dashboard
          </h1>

          {/* User Profile Card Summary */}
          <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-mono text-slate-500 block mb-1">CANDIDATE NAME</span>
              <p className="text-sm font-semibold text-slate-200">{user?.full_name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>

            <div>
              <span className="text-xs font-mono text-slate-500 block mb-1">TARGET ROLE</span>
              <div className="flex items-center space-x-1.5">
                <Target className="w-4 h-4 text-brand-indigo" />
                <span className="text-sm font-semibold text-white">{user?.target_role || 'Not set'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-slate-500 block mb-1">EXPERIENCE LEVEL</span>
              <span className="inline-block px-2.5 py-1 rounded-md bg-brand-indigo/20 text-brand-indigo text-xs font-semibold capitalize">
                {user?.experience_level || 'General'}
              </span>
            </div>
          </div>

          {/* Primary Skills Badges */}
          {user?.primary_skills && user.primary_skills.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-mono text-slate-500 block mb-2">VERIFIED TECH STACK</span>
              <div className="flex flex-wrap gap-2">
                {user.primary_skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-brand-cyan">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed font-mono">
              <span className="text-brand-cyan font-bold">PHASE 2 AUTH COMPLETE:</span> User registration, Login API, Password hashing (`bcrypt`), JWT Tokens (`flask_jwt_extended`), Refresh endpoint, Auth Context, Persistent sessions, & Protected Route guards are active.
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-600 z-10">
        ResumePilot AI &copy; 2026. Phase 2 Authentication & User Management.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Candidate Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
              </ProtectedRoute>
            }
          />

          {/* Default Route Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
