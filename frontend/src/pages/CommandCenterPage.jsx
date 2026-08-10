import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ActionCenter from '../components/command/ActionCenter';
import NotificationCenter from '../components/command/NotificationCenter';
import { commandCenterService } from '../services/commandCenterService';
import {
  Cpu,
  Sparkles,
  Award,
  Target,
  Bot,
  Briefcase,
  FolderCheck,
  Compass,
  Wand2,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
  Zap,
  UserCheck
} from 'lucide-react';

export default function CommandCenterPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Summary Generating State
  const [generatingAi, setGeneratingAi] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await commandCenterService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load Command Center dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleGenerateAiSummary = async () => {
    setGeneratingAi(true);
    try {
      const res = await commandCenterService.generateAiSummary();
      setDashboard((prev) => ({ ...prev, ai_summary: res.ai_summary }));
    } catch (err) {
      alert('Failed to generate AI career summary.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await commandCenterService.markNotificationRead(id);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await commandCenterService.markAllNotificationsRead();
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await commandCenterService.deleteNotification(id);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const getHealthBadgeStyle = (rating) => {
    if (rating === 'Excellent') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (rating === 'Strong') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (rating === 'Developing') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Synthesizing AI Command Center data...</p>
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
          <h2 className="text-xl font-bold text-white mb-2">Command Center Error</h2>
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

  const health = dashboard.health || {};
  const stats = dashboard.quick_stats || {};
  const snapshots = dashboard.snapshots || {};
  const aiSum = dashboard.ai_summary || {};

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10 space-y-8">
        {/* 1. Header Banner */}
        <div className="glass-panel p-6 md:p-8 border border-slate-800/90 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Career Command Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Good morning, {dashboard.candidate_name}!
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Here's what needs your attention today. Target Role: <strong className="text-brand-cyan">{dashboard.target_role}</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleGenerateAiSummary}
              disabled={generatingAi}
              className="px-5 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              {generatingAi ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>AI Executive Career Summary ✨</span>
            </button>
          </div>
        </div>

        {/* 2. Top Row: Overall Career Health Score Card vs AI Executive Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Health Score Gauge */}
          <div className="lg:col-span-5 glass-panel p-6 border border-slate-800/90 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-brand-cyan" />
                  <span>Overall Career Health</span>
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getHealthBadgeStyle(health.rating)}`}>
                  {health.rating}
                </span>
              </div>

              <div className="flex items-center space-x-6 my-2">
                <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                  <span className="text-3xl font-extrabold text-white">{health.score}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">HEALTH SCORE</span>
                </div>

                <div className="flex-1 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ATS Alignment:</span>
                    <span className="text-brand-cyan font-bold">{health.contributing_scores?.ats_performance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interview Rating:</span>
                    <span className="text-brand-indigo font-bold">{health.contributing_scores?.interview_performance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Job Match Strength:</span>
                    <span className="text-purple-400 font-bold">{health.contributing_scores?.job_match_strength}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between items-center">
              <span>Verified deterministic score</span>
              <span>Updated {health.last_updated}</span>
            </div>
          </div>

          {/* AI Executive Career Summary Card */}
          <div className="lg:col-span-7 glass-panel p-6 border border-brand-indigo/30 bg-brand-indigo/5 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-indigo/20 pb-3">
              <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
                <span>AI Career Executive Assessment</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Gemini 2.5 AI Synthesis</span>
            </div>

            {aiSum.summary ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-200 leading-relaxed font-sans font-medium">
                  {aiSum.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1">Key Advantage</span>
                    <p className="text-slate-300 text-[11px]">{aiSum.biggest_strength}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-amber-400 uppercase block mb-1">Top Improvement Area</span>
                    <p className="text-slate-300 text-[11px]">{aiSum.biggest_weakness}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Click "AI Executive Career Summary ✨" above to generate a synthesized assessment.</p>
            )}
          </div>
        </div>

        {/* 3. Quick Statistics Cards Grid (1-Click Nav) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => navigate('/ats')}
            className="glass-panel p-4 border border-slate-800 hover:border-brand-cyan text-center cursor-pointer transition-all group"
          >
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">ATS Score</span>
            <span className="text-xl font-extrabold text-brand-cyan group-hover:scale-105 transition-transform inline-block">
              {stats.ats_score !== 'N/A' ? `${stats.ats_score}%` : 'N/A'}
            </span>
          </div>

          <div
            onClick={() => navigate('/interview')}
            className="glass-panel p-4 border border-slate-800 hover:border-brand-indigo text-center cursor-pointer transition-all group"
          >
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Interview Score</span>
            <span className="text-xl font-extrabold text-brand-indigo group-hover:scale-105 transition-transform inline-block">
              {stats.interview_score !== 'N/A' ? `${stats.interview_score}%` : 'N/A'}
            </span>
          </div>

          <div
            onClick={() => navigate('/jobs')}
            className="glass-panel p-4 border border-slate-800 hover:border-purple-400 text-center cursor-pointer transition-all group"
          >
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Best Job Match</span>
            <span className="text-xl font-extrabold text-purple-400 group-hover:scale-105 transition-transform inline-block">
              {stats.best_job_match}
            </span>
          </div>

          <div
            onClick={() => navigate('/applications')}
            className="glass-panel p-4 border border-slate-800 hover:border-emerald-400 text-center cursor-pointer transition-all group"
          >
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Active Apps</span>
            <span className="text-xl font-extrabold text-emerald-400 group-hover:scale-105 transition-transform inline-block">
              {stats.active_applications}
            </span>
          </div>

          <div
            onClick={() => navigate('/applications')}
            className="glass-panel p-4 border border-slate-800 hover:border-amber-400 text-center cursor-pointer transition-all group"
          >
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Follow-Ups</span>
            <span className="text-xl font-extrabold text-amber-400 group-hover:scale-105 transition-transform inline-block">
              {stats.upcoming_followups}
            </span>
          </div>

          <div
            onClick={() => navigate('/career')}
            className="glass-panel p-4 border border-slate-800 hover:border-brand-cyan text-center cursor-pointer transition-all group"
          >
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Career Readiness</span>
            <span className="text-xl font-extrabold text-brand-cyan group-hover:scale-105 transition-transform inline-block">
              {stats.career_readiness}
            </span>
          </div>
        </div>

        {/* 4. End-to-End Workflow Career Pipeline Overview */}
        <div className="glass-panel p-6 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-cyan" />
            <span>End-to-End Career Execution Lifecycle</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div onClick={() => navigate('/upload')} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo transition-all cursor-pointer space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>1. Resume Parsing</span>
                <Wand2 className="w-3.5 h-3.5 text-brand-cyan" />
              </div>
              <p className="text-[11px] text-slate-400">Parsed & Optimized</p>
            </div>

            <div onClick={() => navigate('/ats')} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo transition-all cursor-pointer space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>2. ATS Scanner</span>
                <Target className="w-3.5 h-3.5 text-brand-indigo" />
              </div>
              <p className="text-[11px] text-slate-400">{snapshots.ats?.score ? `${snapshots.ats.score}% Match` : 'Scan Needed'}</p>
            </div>

            <div onClick={() => navigate('/interview')} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo transition-all cursor-pointer space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>3. AI Interview</span>
                <Bot className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-400">{snapshots.interview?.score ? `${snapshots.interview.score}% Rating` : 'Practice Needed'}</p>
            </div>

            <div onClick={() => navigate('/jobs')} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo transition-all cursor-pointer space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>4. Job Matches</span>
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">{snapshots.job_matches?.best_match ? `${snapshots.job_matches.best_match}% Top Match` : 'Explore Jobs'}</p>
            </div>

            <div onClick={() => navigate('/applications')} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo transition-all cursor-pointer space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>5. Applications</span>
                <FolderCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">{stats.active_applications} Active Applications</p>
            </div>

            <div onClick={() => navigate('/career')} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo transition-all cursor-pointer space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>6. Career Roadmap</span>
                <Compass className="w-3.5 h-3.5 text-brand-cyan" />
              </div>
              <p className="text-[11px] text-slate-400">{stats.career_readiness} Readiness</p>
            </div>
          </div>
        </div>

        {/* 5. Priority Action Center & Notifications Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Priority Actions */}
          <div className="lg:col-span-7 glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 text-brand-cyan" />
              <span>Priority Action Center</span>
            </h3>

            <ActionCenter actions={dashboard.priority_actions} />
          </div>

          {/* Smart Notifications */}
          <div className="lg:col-span-5">
            <NotificationCenter
              notifications={dashboard.notifications}
              unreadCount={dashboard.unread_notifications_count}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onDelete={handleDeleteNotification}
            />
          </div>
        </div>

        {/* 6. Applications Requiring Attention & Skill Gap Overview Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Needing Attention */}
          <div className="glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Applications Requiring Attention ({dashboard.applications_attention?.length || 0})</span>
            </h3>

            {(dashboard.applications_attention || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800">
                All tracked job applications are currently up to date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dashboard.applications_attention.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/applications/${item.id}`)}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition-all cursor-pointer"
                  >
                    <div>
                      <h4 className="font-bold text-white">{item.job_title} — {item.company_name}</h4>
                      <p className="text-[11px] text-amber-400 font-mono mt-0.5">{item.reason}</p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skill Gap Synthesis */}
          <div className="glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-brand-amber" />
              <span>Target Skill Gap Synthesis ({dashboard.skill_gaps?.length || 0})</span>
            </h3>

            {(dashboard.skill_gaps || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800">
                No major skill gaps identified in active job matches or ATS scans.
              </div>
            ) : (
              <div className="space-y-2">
                {dashboard.skill_gaps.map((sg, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{sg.skill}</span>
                        <span className="px-2 py-0.5 rounded bg-brand-indigo/20 text-brand-cyan text-[10px] font-mono">
                          {sg.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{sg.recommended_action}</p>
                    </div>

                    <button
                      onClick={() => navigate('/career')}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-brand-cyan text-[11px] font-semibold rounded-lg border border-slate-800 shrink-0"
                    >
                      Add to Roadmap
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 7. Module Snapshots Grid (Resume & ATS, Interview, Job Matches) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resume & ATS Snapshot */}
          <div className="glass-panel p-6 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                <Target className="w-4 h-4 text-brand-cyan" />
                <span>Resume & ATS Snapshot</span>
              </h3>
              <p className="text-xs text-slate-400">
                Latest ATS Score: <strong className="text-white">{snapshots.ats?.score ? `${snapshots.ats.score}%` : 'Not Scanned'}</strong>
              </p>
              {snapshots.ats?.missing_keywords && snapshots.ats.missing_keywords.length > 0 && (
                <div className="mt-3">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase mb-1">Missing Keywords</span>
                  <div className="flex flex-wrap gap-1">
                    {snapshots.ats.missing_keywords.map((k, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono">
                        + {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => navigate('/ats')}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 text-center"
              >
                Run ATS Scan
              </button>
              <button
                onClick={() => navigate('/resume-optimizer')}
                className="flex-1 py-2 bg-brand-indigo/20 hover:bg-brand-indigo/30 text-brand-cyan text-xs font-semibold rounded-xl border border-brand-indigo/30 text-center"
              >
                Resume Studio
              </button>
            </div>
          </div>

          {/* Mock Interview Snapshot */}
          <div className="glass-panel p-6 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                <Bot className="w-4 h-4 text-brand-indigo" />
                <span>AI Interview Snapshot</span>
              </h3>
              <p className="text-xs text-slate-400">
                Latest Evaluation Rating: <strong className="text-white">{snapshots.interview?.score ? `${snapshots.interview.score}%` : 'Not Evaluated'}</strong>
              </p>
              {snapshots.interview?.weaknesses && snapshots.interview.weaknesses.length > 0 && (
                <div className="mt-3">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase mb-1">Target Weaknesses</span>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {snapshots.interview.weaknesses.map((w, idx) => (
                      <li key={idx}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/interview')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 text-center pt-2 border-t border-slate-800"
            >
              Start Mock Interview
            </button>
          </div>

          {/* Job Matches Snapshot */}
          <div className="glass-panel p-6 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span>Job Matches Snapshot</span>
              </h3>
              <p className="text-xs text-slate-400">
                Recommended Opportunities: <strong className="text-white">{snapshots.job_matches?.total_matches || 0} jobs</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Highest Match Score: <strong className="text-purple-400">{snapshots.job_matches?.best_match || 0}%</strong>
              </p>
            </div>

            <button
              onClick={() => navigate('/jobs')}
              className="w-full py-2 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md glow-cyan-sm text-center pt-2 border-t border-slate-800"
            >
              Explore Job Matches
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Career Command Center & Smart Notifications.
      </footer>
    </div>
  );
}
