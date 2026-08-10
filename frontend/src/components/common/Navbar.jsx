import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, UploadCloud, LayoutDashboard, LogOut, User as UserIcon, Bot, Target, Briefcase, Compass, Wand2, FolderCheck } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Resume', path: '/upload', icon: UploadCloud },
    { name: 'ATS Scanner', path: '/ats', icon: Target },
    { name: 'AI Interview', path: '/interview', icon: Bot },
    { name: 'Job Matches', path: '/jobs', icon: Briefcase },
    { name: 'Career Planner', path: '/career', icon: Compass },
    { name: 'Resume Studio', path: '/resume-optimizer', icon: Wand2 },
    { name: 'Applications', path: '/applications', icon: FolderCheck },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel rounded-none border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">{APP_NAME}</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-indigo text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Candidate Profile & Sign Out */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="text-slate-300 font-medium truncate max-w-[120px]">{user.full_name}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
