import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { commandCenterService } from '../../services/commandCenterService';
import { Sparkles, UploadCloud, LayoutDashboard, LogOut, User as UserIcon, Bot, Target, Briefcase, Compass, Wand2, FolderCheck, Cpu, Bell } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (user) {
          const res = await commandCenterService.getSummary();
          setUnreadCount(res.unread_notifications_count || 0);
        }
      } catch (err) {
        // Silent error catch for unread badge
      }
    };

    fetchUnread();
  }, [user, location]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Command Center', path: '/command-center', icon: Cpu },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload', path: '/upload', icon: UploadCloud },
    { name: 'ATS Scanner', path: '/ats', icon: Target },
    { name: 'AI Interview', path: '/interview', icon: Bot },
    { name: 'Job Matches', path: '/jobs', icon: Briefcase },
    { name: 'Career Planner', path: '/career', icon: Compass },
    { name: 'Resume Studio', path: '/resume-optimizer', icon: Wand2 },
    { name: 'Applications', path: '/applications', icon: FolderCheck },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel rounded-none border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 md:px-8 py-3 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/command-center" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white hidden sm:inline">{APP_NAME}</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/dashboard' && link.path !== '/command-center' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
        <div className="flex items-center space-x-2.5">
          {/* Notification Bell Badge */}
          <Link
            to="/command-center"
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Command Center Notifications"
          >
            <Bell className="w-4 h-4 text-brand-cyan" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border border-slate-950">
                {unreadCount}
              </span>
            )}
          </Link>

          {user && (
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="text-slate-300 font-medium truncate max-w-[100px]">{user.full_name}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-all cursor-pointer"
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
