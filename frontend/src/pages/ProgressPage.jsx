import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import GoalProgress from '../components/progress/GoalProgress';
import SkillProgress from '../components/progress/SkillProgress';
import TaskCenter from '../components/progress/TaskCenter';
import MilestoneTimeline from '../components/progress/MilestoneTimeline';
import ProgressTrendChart from '../components/progress/ProgressTrendChart';
import { progressService } from '../services/progressService';
import {
  TrendingUp,
  Sparkles,
  Award,
  Target,
  Compass,
  Zap,
  Loader2,
  AlertCircle,
  Play,
  RefreshCw,
  ArrowRight,
  Brain,
  Wand2,
  FolderCheck,
  Briefcase,
  Bot
} from 'lucide-react';

export default function ProgressPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Progress Coach State
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await progressService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch career progress dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSyncProgress = async () => {
    setSyncing(true);
    try {
      const res = await progressService.syncProgress();
      setDashboard(res.dashboard);
    } catch (err) {
      alert('Failed to sync progress tasks.');
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateCoach = async () => {
    setAnalyzingAi(true);
    try {
      const res = await progressService.getCoach();
      setDashboard((prev) => ({ ...prev, ai_coach: res.ai_coach }));
    } catch (err) {
      alert('Failed to generate AI progress coaching.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await progressService.updateTask(taskId, status);
      fetchDashboard();
    } catch (err) {
      alert('Failed to update task status.');
    }
  };

  const getRatingBadgeStyle = (rating) => {
    if (rating === 'Excellent Momentum') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (rating === 'Good Progress') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (rating === 'Building Momentum') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-900 text-slate-400 border-slate-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Synthesizing candidate career execution progress...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto w-full p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-brand-rose mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Progress Dashboard Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    has_activity = false,
    overall = {},
    weekly = {},
    goals = [],
    skills = [],
    tasks = [],
    milestones = [],
    ai_coach = null
  } = dashboard;

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10 space-y-8">
        {/* 1. Header Banner */}
        <div className="glass-panel p-6 md:p-8 border border-slate-800/90 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>AI Career Progress Tracking & Goal Execution System</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Career Progress
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Turn your career plan into measurable progress. Execute goals, complete skills, and track application velocity.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={handleSyncProgress}
              disabled={syncing}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl text-xs border border-slate-800 flex items-center space-x-2 transition-all cursor-pointer"
              title="Sync tasks from all modules"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-brand-cyan' : ''}`} />
              <span>Sync Module Tasks</span>
            </button>
          </div>
        </div>

        {/* 2. Empty State View if candidate has very little activity */}
        {!has_activity ? (
          <div className="glass-panel p-12 text-center border border-slate-800/90 flex flex-col items-center justify-center my-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <TrendingUp className="w-8 h-8 text-brand-cyan" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white mb-1">Start Building Your Career Progress</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Progress tracking automatically calculates as you set career planner goals, complete skill roadmap items, practice mock interviews, optimize your resume, and track job applications.
              </p>
              <button
                onClick={() => navigate('/career')}
                className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan text-white font-bold rounded-xl text-xs shadow-md glow-cyan-sm"
              >
                Open Career Planner
              </button>
            </div>
          </div>
        ) : (
          /* 3. Full Progress Tracking Workspace */
          <div className="space-y-8">
            {/* Top Row: Overall Progress Card vs This Week Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Overall Progress Card */}
              <div className="lg:col-span-5 glass-panel p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <Award className="w-4 h-4 text-brand-cyan" />
                      <span>Overall Career Execution</span>
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRatingBadgeStyle(overall.rating)}`}>
                      {overall.rating}
                    </span>
                  </div>

                  <div className="flex items-center space-x-5 my-2">
                    <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                      <span className="text-3xl font-extrabold text-white">
                        {overall.score !== null ? `${overall.score}%` : 'N/A'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">PROGRESS</span>
                    </div>

                    {/* Breakdown bars */}
                    <div className="flex-1 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Goals:</span>
                        <span className="text-brand-cyan font-bold">{overall.breakdown?.goals || 0}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Skills:</span>
                        <span className="text-brand-indigo font-bold">{overall.breakdown?.skills || 0}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Interview:</span>
                        <span className="text-purple-400 font-bold">{overall.breakdown?.interview || 0}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Applications:</span>
                        <span className="text-emerald-400 font-bold">{overall.breakdown?.applications || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
                  Calculated deterministically from verified execution evidence.
                </div>
              </div>

              {/* This Week Card Metrics */}
              <div className="lg:col-span-7 glass-panel p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-brand-cyan" />
                    <span>This Week's Velocity & Execution Summary</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    Trend: {weekly.weekly_trend || 'Stable'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Tasks Completed</span>
                    <span className="text-xl font-extrabold text-emerald-400">{weekly.tasks_completed}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Tasks Remaining</span>
                    <span className="text-xl font-extrabold text-brand-cyan">{weekly.tasks_remaining}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Goals Advanced</span>
                    <span className="text-xl font-extrabold text-brand-indigo">{weekly.goals_advanced}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Skills Completed</span>
                    <span className="text-xl font-extrabold text-purple-400">{weekly.skills_completed}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
                  <span>Applications Tracked: <strong>{weekly.applications_submitted}</strong></span>
                  <span>Active Interviews: <strong>{weekly.interviews_completed}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                onClick={() => navigate('/career')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-brand-cyan flex items-center space-x-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-brand-cyan shrink-0" />
                <span className="truncate">Career Plan</span>
              </button>

              <button
                onClick={() => navigate('/interview-intelligence')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-brand-indigo flex items-center space-x-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-brand-indigo shrink-0" />
                <span className="truncate">Practice Interview</span>
              </button>

              <button
                onClick={() => navigate('/resume-optimizer')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-purple-400 flex items-center space-x-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">Optimize Resume</span>
              </button>

              <button
                onClick={() => navigate('/jobs')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-400 flex items-center space-x-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Explore Jobs</span>
              </button>

              <button
                onClick={() => navigate('/applications')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-amber-400 flex items-center space-x-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <FolderCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Applications</span>
              </button>
            </div>

            {/* AI Progress Coach ✨ Section */}
            <div className="glass-panel p-6 border border-brand-indigo/30 bg-brand-indigo/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>AI Progress Coach ✨</span>
                </h3>

                <button
                  onClick={handleGenerateCoach}
                  disabled={analyzingAi}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-md glow-cyan-sm flex items-center space-x-2 transition-all cursor-pointer shrink-0"
                >
                  {analyzingAi ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span>Analyze My Progress</span>
                </button>
              </div>

              {ai_coach ? (
                <div className="space-y-4 text-xs pt-1">
                  <p className="text-slate-200 leading-relaxed font-sans font-medium">
                    {ai_coach.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1">Top Accomplishment</span>
                      <p className="text-slate-300 text-[11px]">{ai_coach.biggest_accomplishment}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-mono text-amber-400 uppercase block mb-1">Primary Execution Blocker</span>
                      <p className="text-slate-300 text-[11px]">{ai_coach.biggest_blocker}</p>
                    </div>
                  </div>

                  {ai_coach.next_7_days && (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono text-brand-cyan uppercase block font-bold">7-Day Target Focus</span>
                      <ul className="space-y-1 text-slate-300">
                        {ai_coach.next_7_days.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-brand-cyan font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Click "Analyze My Progress" above to synthesize AI execution coaching.</p>
              )}
            </div>

            {/* Weekly Actionable Task Execution Center */}
            <TaskCenter tasks={tasks} onUpdateStatus={handleUpdateTaskStatus} />

            {/* Goal Execution & Skill Roadmap Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalProgress goals={goals} />
              <SkillProgress skills={skills} />
            </div>

            {/* Milestones & Progress Trend Chart Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MilestoneTimeline milestones={milestones} />
              <ProgressTrendChart overall={overall} weekly={weekly} />
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Career Progress Tracking & Goal Execution System.
      </footer>
    </div>
  );
}
