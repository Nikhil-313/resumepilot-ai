import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import InterviewTrendChart from '../components/interview/InterviewTrendChart';
import RecurringWeaknesses from '../components/interview/RecurringWeaknesses';
import InterviewStrengths from '../components/interview/InterviewStrengths';
import AdaptivePracticePlan from '../components/interview/AdaptivePracticePlan';
import { interviewIntelligenceService } from '../services/interviewIntelligenceService';
import {
  Bot,
  Sparkles,
  Award,
  TrendingUp,
  AlertTriangle,
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
  Play,
  Eye,
  Calendar,
  Layers,
  Brain,
  CheckCircle2
} from 'lucide-react';

export default function InterviewIntelligencePage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Coaching State
  const [analyzingAi, setAnalyzingAi] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await interviewIntelligenceService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch interview intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleGenerateCoaching = async () => {
    setAnalyzingAi(true);
    try {
      const res = await interviewIntelligenceService.getCoaching();
      setDashboard((prev) => ({ ...prev, ai_coaching: res.ai_coaching }));
    } catch (err) {
      alert('Failed to generate AI interview coaching.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleUpdateRecommendationStatus = async (id, status) => {
    try {
      await interviewIntelligenceService.updateRecommendation(id, status);
      fetchDashboard();
    } catch (err) {
      alert('Failed to update recommendation status.');
    }
  };

  const getReadinessBadgeStyle = (rating) => {
    if (rating === 'Interview Ready') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (rating === 'Strong Progress') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (rating === 'Developing') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (rating === 'Limited Data') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    return 'bg-slate-900 text-slate-400 border-slate-800';
  };

  const getTrendBadge = (trend) => {
    if (trend === 'Improving') return { label: '↑ Improving', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (trend === 'Declining') return { label: '↓ Declining', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    if (trend === 'Stable') return { label: '→ Stable', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
    return { label: '• Insufficient Data', color: 'text-slate-400 bg-slate-900 border-slate-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Analyzing historical interview performance data...</p>
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
          <h2 className="text-xl font-bold text-white mb-2">Intelligence Error</h2>
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
    has_data = false,
    readiness = {},
    performance_overview = {},
    trends = [],
    recurring_weaknesses = [],
    recurring_strengths = [],
    recommendations = [],
    recent_sessions = [],
    ai_coaching = null
  } = dashboard;

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10 space-y-8">
        {/* 1. Header Banner */}
        <div className="glass-panel p-6 md:p-8 border border-slate-800/90 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Interview Performance Intelligence & Adaptive Practice</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Interview Performance Intelligence
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Understand your interview performance, track improvement across sessions, and practice what matters most.
            </p>
          </div>

          <button
            onClick={() => navigate('/interview')}
            className="px-6 py-3.5 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-lg glow-cyan-sm text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Mock Interview</span>
          </button>
        </div>

        {/* 2. Empty State View if candidate has zero completed mock interview evaluations */}
        {!has_data ? (
          <div className="glass-panel p-12 text-center border border-slate-800/90 flex flex-col items-center justify-center my-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Brain className="w-8 h-8 text-brand-cyan" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white mb-1">No Interview Evaluations Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Complete your first mock interview in the AI Live Arena to start building your Interview Intelligence profile and tracking performance trends.
              </p>
              <button
                onClick={() => navigate('/interview')}
                className="px-6 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan text-white font-bold rounded-xl text-xs shadow-md glow-cyan-sm"
              >
                Start Your First Mock Interview
              </button>
            </div>
          </div>
        ) : (
          /* 3. Full Interview Intelligence Workspace */
          <div className="space-y-8">
            {/* Top Row: Readiness Score Card & Overview Sub-scores */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Readiness Score Card */}
              <div className="lg:col-span-4 glass-panel p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <Award className="w-4 h-4 text-brand-cyan" />
                      <span>Interview Readiness Score</span>
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getReadinessBadgeStyle(readiness.rating)}`}>
                      {readiness.rating}
                    </span>
                  </div>

                  <div className="flex items-center space-x-5 my-2">
                    <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                      <span className="text-3xl font-extrabold text-white">
                        {readiness.score !== null ? `${readiness.score}` : 'N/A'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">READINESS</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {readiness.message}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
                  Calculated deterministically from completed evaluations.
                </div>
              </div>

              {/* 5-Dimension Performance Overview Cards */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(performance_overview).map(([key, data]) => {
                  const badge = getTrendBadge(data.trend);
                  return (
                    <div key={key} className="glass-panel p-4 border border-slate-800 text-center flex flex-col justify-between space-y-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        {key.replace('_', ' ')}
                      </span>

                      <div>
                        <span className="text-2xl font-extrabold text-white block">
                          {data.latest !== null ? `${data.latest}%` : 'N/A'}
                        </span>
                        {data.previous !== null && (
                          <span className="text-[10px] font-mono text-slate-500 block">Prev: {data.previous}%</span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Interview Coach Section */}
            <div className="glass-panel p-6 border border-brand-indigo/30 bg-brand-indigo/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>AI Interview Coach ✨</span>
                </h3>

                <button
                  onClick={handleGenerateCoaching}
                  disabled={analyzingAi}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-md glow-cyan-sm flex items-center space-x-2 transition-all cursor-pointer shrink-0"
                >
                  {analyzingAi ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span>Analyze My Interview Performance</span>
                </button>
              </div>

              {ai_coaching ? (
                <div className="space-y-4 text-xs pt-1">
                  <p className="text-slate-200 leading-relaxed font-sans font-medium">
                    {ai_coaching.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1">Key Strength</span>
                      <p className="text-slate-300 text-[11px]">{ai_coaching.biggest_strength}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-mono text-amber-400 uppercase block mb-1">Primary Weakness</span>
                      <p className="text-slate-300 text-[11px]">{ai_coaching.biggest_weakness}</p>
                    </div>
                  </div>

                  {ai_coaching.preparation_plan && (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono text-brand-cyan uppercase block font-bold">Preparation Strategy</span>
                      <ul className="space-y-1 text-slate-300">
                        {ai_coaching.preparation_plan.map((step, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-brand-cyan font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Click "Analyze My Interview Performance" above to generate qualitative AI coaching.</p>
              )}
            </div>

            {/* Chronological Performance Trend Chart */}
            <InterviewTrendChart trends={trends} />

            {/* Recurring Weaknesses & Strengths Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecurringWeaknesses weaknesses={recurring_weaknesses} />
              <InterviewStrengths strengths={recurring_strengths} />
            </div>

            {/* Adaptive Practice Plan */}
            <AdaptivePracticePlan
              recommendations={recommendations}
              onUpdateStatus={handleUpdateRecommendationStatus}
            />

            {/* Recent Evaluated Sessions History */}
            <div className="glass-panel p-6 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-brand-cyan" />
                <span>Evaluated Mock Interview History ({recent_sessions.length})</span>
              </h3>

              <div className="space-y-3">
                {recent_sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => navigate(`/interview/report/${sess.id}`)}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-brand-indigo/20 text-brand-indigo text-[10px] font-mono font-bold">
                          {sess.role}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono">
                          {sess.difficulty}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {sess.date}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs">
                        <span className="font-bold text-white">Overall: {sess.overall}%</span>
                        <span className="text-slate-400">• Tech: {sess.technical}%</span>
                        <span className="text-slate-400">• Comm: {sess.communication}%</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/interview/report/${sess.id}`);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>View Session Evaluation</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Interview Performance Intelligence & Adaptive Practice.
      </footer>
    </div>
  );
}
