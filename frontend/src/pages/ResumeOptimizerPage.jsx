import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import { resumeOptimizerService } from '../services/resumeOptimizerService';
import { resumeService } from '../services/resumeService';
import {
  Sparkles,
  Wand2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Loader2,
  AlertCircle,
  Cpu,
  Layers,
  Check,
  X,
  History,
  Eye,
  Trash2,
  Calendar,
  Building2,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ResumeOptimizerPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [targetCompany, setTargetCompany] = useState('');

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [error, setError] = useState('');

  // History States
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingRecId, setUpdatingRecId] = useState(null);

  // Section Accordion State
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    skills: true,
    experience: true,
    projects: false,
    education: false
  });

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await resumeOptimizerService.getHistory();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load optimization history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingResumes(true);
        const [resumeData] = await Promise.all([
          resumeService.getAllResumes().catch(() => ({ resumes: [] })),
          loadHistory()
        ]);

        const userResumes = resumeData.resumes || [];
        setResumes(userResumes);
        if (userResumes.length > 0) {
          setSelectedResumeId(userResumes[0].id);
        }
      } catch (err) {
        setError('Failed to load candidate resumes.');
      } finally {
        setLoadingResumes(false);
      }
    };

    initData();
  }, []);

  const handleOptimize = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedResumeId) {
      setError('Please select a resume to optimize.');
      return;
    }

    if (!targetRole.trim()) {
      setError('Please specify a target role.');
      return;
    }

    setAnalyzing(true);
    setOptimization(null);

    try {
      const payload = {
        resume_id: selectedResumeId,
        target_role: targetRole,
        target_company: targetCompany || '',
      };

      const res = await resumeOptimizerService.analyzeResume(payload);
      setOptimization(res.optimization);
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to optimize resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRecommendationStatus = async (recId, status) => {
    setUpdatingRecId(recId);
    try {
      const res = await resumeOptimizerService.updateRecommendation(recId, status);
      // Update local optimization object
      setOptimization(res.optimization);
    } catch (err) {
      alert('Failed to update recommendation status.');
    } finally {
      setUpdatingRecId(null);
    }
  };

  const handleDeleteOptimization = async (optId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume optimization report?')) return;

    setDeletingId(optId);
    try {
      await resumeOptimizerService.deleteOptimization(optId);
      if (optimization && optimization.id === optId) {
        setOptimization(null);
      }
      await loadHistory();
    } catch (err) {
      alert('Failed to delete optimization report.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSection = (sec) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return { label: 'Excellent ATS Quality', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (score >= 70) return { label: 'Good Quality', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    return { label: 'Needs Improvement', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  };

  const optRes = optimization?.optimized_resume || {};
  const recs = optimization?.recommendations || [];

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10 print:p-0 print:max-w-none">
        {/* Header Banner */}
        <div className="glass-panel p-6 md:p-8 mb-8 border border-slate-800/90 relative print:hidden">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Resume Improvement & Optimization Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Resume Optimization Studio
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Transform your resume into a high-impact, ATS-optimized document tailored specifically to your target role without fabricating fake qualifications.
          </p>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-black">{optRes.name || 'Candidate'} - Optimized Resume</h1>
          <p className="text-sm text-gray-600">Target Role: {optimization?.target_role} {optimization?.target_company && `at ${optimization?.target_company}`}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 print:hidden">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* 2-Column Split Workspace: Form on Left vs Dashboard on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form Column & History List */}
          <div className="lg:col-span-4 space-y-6 print:hidden">
            {/* Configuration Form */}
            <form onSubmit={handleOptimize} className="glass-panel p-6 border border-slate-800 space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Wand2 className="w-4 h-4 text-brand-indigo" />
                <span>Configure Resume Studio</span>
              </h2>

              {/* Resume Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Resume</label>
                {loadingResumes ? (
                  <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-500 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
                    <span>Loading resumes...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-400">
                    No uploaded resumes found. Please upload a resume first.
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo font-medium"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                        {r.filename} ({new Date(r.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target Role Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              {/* Target Company Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Company (Optional)</label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={analyzing || resumes.length === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-lg glow-cyan-sm text-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>AI is analyzing your resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Optimize My Resume</span>
                  </>
                )}
              </button>
            </form>

            {/* Optimization History List */}
            <div className="glass-panel p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <History className="w-4 h-4 text-brand-cyan" />
                  <span>Previous Optimizations ({history.length})</span>
                </h2>
                {loadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />}
              </div>

              {history.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800/80">
                  No previous optimizations found.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {history.map((item) => {
                    const isSelected = optimization?.id === item.id;
                    const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <div
                        key={item.id}
                        onClick={() => setOptimization(item)}
                        className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-brand-indigo/15 border-brand-indigo text-white ring-1 ring-brand-indigo'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white truncate max-w-[150px]">
                              {item.target_role}
                            </h4>
                            {item.target_company && (
                              <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-500" />
                                <span>{item.target_company}</span>
                              </p>
                            )}
                          </div>

                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-brand-cyan shrink-0">
                            {item.overall_improvement_score}% Score
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{dateStr}</span>
                          </span>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOptimization(item);
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center space-x-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteOptimization(item.id, e)}
                              disabled={deletingId === item.id}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Results Column */}
          <div className="lg:col-span-8 space-y-6">
            {analyzing ? (
              /* Loading State */
              <div className="glass-panel p-12 text-center border border-slate-800 flex flex-col items-center justify-center my-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm mb-6 animate-pulse">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI is analyzing your resume...</h3>
                <p className="text-xs text-brand-cyan font-mono animate-pulse mb-4 max-w-md">
                  Analyzing ATS keywords, STAR achievement verbs, and non-fabricating wording improvements...
                </p>
                <div className="w-full max-w-xs bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-brand-indigo to-brand-cyan h-2 rounded-full animate-pulse-slow w-full" />
                </div>
              </div>
            ) : !optimization ? (
              /* Empty Initial State */
              <div className="glass-panel p-12 text-center border border-slate-800/90 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
                  <FileText className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No Active Optimization Session</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Select your resume, enter your target job role on the left, and click "Optimize My Resume".
                </p>
              </div>
            ) : (
              /* Full AI Optimization Dashboard & Recommendations */
              <div className="space-y-6">
                {/* 1. Score Overview Banner */}
                <div className="glass-panel p-6 border border-slate-800/90 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center space-x-5">
                      <div className="w-20 h-20 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                        <span className="text-2xl font-extrabold text-white">{optimization.overall_improvement_score}%</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">OVERALL SCORE</span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getScoreBadge(optimization.overall_improvement_score).color}`}>
                            {getScoreBadge(optimization.overall_improvement_score).label}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                          {optimization.target_role} {optimization.target_company && `at ${optimization.target_company}`}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Resume: {optimization.resume_filename}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-all shrink-0 print:hidden"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Download Optimized Resume</span>
                    </button>
                  </div>

                  {/* 5-Metric Breakdown Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-4 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">ATS Score</span>
                      <span className="text-xs font-bold text-brand-cyan">{optimization.ats_improvement_score}%</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Content Quality</span>
                      <span className="text-xs font-bold text-brand-indigo">{optimization.content_quality_score}%</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Keywords</span>
                      <span className="text-xs font-bold text-purple-400">{optimization.keyword_optimization_score}%</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Impact Score</span>
                      <span className="text-xs font-bold text-emerald-400">{optimization.impact_score}%</span>
                    </div>
                  </div>
                </div>

                {/* 2. Resume Health Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-5 border border-emerald-500/20 bg-emerald-500/5">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
                      <span>Resume Strengths</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {(optimization.strengths || []).map((str, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-brand-emerald font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-panel p-5 border border-amber-500/20 bg-amber-500/5">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-brand-amber shrink-0" />
                      <span>Priority Improvement Areas</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {(optimization.priority_improvements || []).map((prio, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-brand-amber font-bold">•</span>
                          <span>{prio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Section-by-Section Interactive Recommendations */}
                <div className="glass-panel p-6 border border-slate-800 space-y-4 print:hidden">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Wand2 className="w-4 h-4 text-brand-cyan" />
                    <span>AI Section Wording Recommendations ({recs.length})</span>
                  </h3>

                  {recs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No section recommendations generated.</p>
                  ) : (
                    recs.map((rec) => {
                      const isAccepted = rec.status === 'accepted';
                      const isRejected = rec.status === 'rejected';

                      return (
                        <div
                          key={rec.id}
                          className={`p-4 rounded-xl border space-y-3 transition-all ${
                            isAccepted
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : isRejected
                              ? 'bg-rose-500/10 border-rose-500/30 opacity-60'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded bg-brand-indigo/20 text-brand-indigo font-mono text-[10px] font-bold uppercase">
                                {rec.section}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                rec.priority === 'High' ? 'text-rose-400' : 'text-amber-400'
                              }`}>
                                {rec.priority} Priority
                              </span>
                            </div>

                            {/* Status Badge & Actions */}
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleRecommendationStatus(rec.id, 'accepted')}
                                disabled={updatingRecId === rec.id}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                                  isAccepted
                                    ? 'bg-emerald-500 text-white font-bold'
                                    : 'bg-slate-900 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isAccepted ? 'Accepted ✓' : 'Accept'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRecommendationStatus(rec.id, 'rejected')}
                                disabled={updatingRecId === rec.id}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                                  isRejected
                                    ? 'bg-rose-500 text-white font-bold'
                                    : 'bg-slate-900 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{isRejected ? 'Rejected ✕' : 'Reject'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Before vs After Comparison Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                            {/* Original Text */}
                            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">ORIGINAL TEXT</span>
                              <p className="text-slate-300 font-sans leading-relaxed">
                                {rec.original_text || <span className="italic text-slate-600">None specified</span>}
                              </p>
                            </div>

                            {/* AI Suggested Wording */}
                            <div className="p-3 rounded-lg bg-brand-indigo/10 border border-brand-indigo/20">
                              <span className="text-[10px] font-mono text-brand-cyan uppercase block mb-1">AI SUGGESTED WORDING</span>
                              <p className="text-white font-sans leading-relaxed">
                                {rec.suggested_text}
                              </p>
                            </div>
                          </div>

                          {/* Reason */}
                          {rec.reason && (
                            <p className="text-[11px] text-slate-400 italic">
                              💡 <strong>Why this improves resume:</strong> {rec.reason}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 4. Optimized Resume Document Preview */}
                <div className="glass-panel p-6 md:p-8 border border-slate-800 space-y-6 print:border-none print:p-0 print:bg-white print:text-black">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-brand-cyan" />
                      <span>Optimized Resume Preview</span>
                    </h3>

                    <button
                      onClick={handleDownloadPDF}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Document</span>
                    </button>
                  </div>

                  {/* Rendered Document Body */}
                  <div className="space-y-6 text-xs leading-relaxed">
                    {/* Header Name & Contact */}
                    <div className="border-b border-slate-800/80 pb-4">
                      <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{optRes.name || 'Candidate Name'}</h1>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                        {optRes.email && <span>{optRes.email}</span>}
                        {optRes.phone && <span>• {optRes.phone}</span>}
                        {optRes.links?.linkedin && <span>• {optRes.links.linkedin}</span>}
                        {optRes.links?.github && <span>• {optRes.links.github}</span>}
                      </div>
                    </div>

                    {/* Summary */}
                    {optRes.summary && (
                      <div>
                        <h4 className="font-bold text-brand-cyan uppercase tracking-wider text-[11px] mb-1.5 border-b border-slate-800/60 pb-1">
                          Professional Summary
                        </h4>
                        <p className="text-slate-300">{optRes.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {optRes.skills && optRes.skills.length > 0 && (
                      <div>
                        <h4 className="font-bold text-brand-cyan uppercase tracking-wider text-[11px] mb-1.5 border-b border-slate-800/60 pb-1">
                          Technical Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {optRes.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {optRes.experience && optRes.experience.length > 0 && (
                      <div>
                        <h4 className="font-bold text-brand-cyan uppercase tracking-wider text-[11px] mb-2 border-b border-slate-800/60 pb-1">
                          Professional Experience
                        </h4>
                        <div className="space-y-3">
                          {optRes.experience.map((exp, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between font-semibold text-slate-200">
                                <span>{exp.title} — {exp.company}</span>
                                <span className="text-[10px] font-mono text-slate-400">{exp.dates}</span>
                              </div>
                              {exp.bullets && (
                                <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                                  {exp.bullets.map((b, bIdx) => (
                                    <li key={bIdx}>{b}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {optRes.projects && optRes.projects.length > 0 && (
                      <div>
                        <h4 className="font-bold text-brand-cyan uppercase tracking-wider text-[11px] mb-2 border-b border-slate-800/60 pb-1">
                          Key Technical Projects
                        </h4>
                        <div className="space-y-3">
                          {optRes.projects.map((proj, idx) => (
                            <div key={idx} className="space-y-1">
                              <span className="font-semibold text-slate-200">{proj.name}</span>
                              {proj.description && <p className="text-slate-400 text-[11px]">{proj.description}</p>}
                              {proj.bullets && (
                                <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                                  {proj.bullets.map((b, bIdx) => (
                                    <li key={bIdx}>{b}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {optRes.education && optRes.education.length > 0 && (
                      <div>
                        <h4 className="font-bold text-brand-cyan uppercase tracking-wider text-[11px] mb-1.5 border-b border-slate-800/60 pb-1">
                          Education & Training
                        </h4>
                        {optRes.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span>{edu.degree || edu.institution}</span>
                            <span className="text-[10px] font-mono text-slate-400">{edu.year || edu.dates}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900 print:hidden">
        ResumePilot AI &copy; 2026. AI Resume Improvement & Optimization Studio.
      </footer>
    </div>
  );
}
