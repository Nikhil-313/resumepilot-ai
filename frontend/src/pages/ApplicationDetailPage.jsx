import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { applicationService } from '../services/applicationService';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Sparkles,
  Clock,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Tag,
  BookmarkPlus,
  FileText
} from 'lucide-react';

const STAGES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Final Round', 'Offer', 'Rejected', 'Withdrawn'];

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Activity Form State
  const [newActivity, setNewActivity] = useState({
    title: '',
    activity_type: 'Note',
    description: '',
    activity_date: new Date().toISOString().split('T')[0]
  });
  const [addingActivity, setAddingActivity] = useState(false);

  // Follow-up Form State
  const [newFollowup, setNewFollowup] = useState({
    title: 'Check application status',
    follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });
  const [addingFollowup, setAddingFollowup] = useState(false);

  // AI Follow-up Assistant State
  const [aiFollowup, setAiFollowup] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getApplicationById(id);
      setAppData(data.application);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  const handleStageChange = async (newStage) => {
    try {
      await applicationService.updateStage(id, newStage);
      fetchApplication();
    } catch (err) {
      alert('Failed to update application stage.');
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.title.trim()) return;

    setAddingActivity(true);
    try {
      await applicationService.addActivity(id, newActivity);
      setNewActivity({
        title: '',
        activity_type: 'Note',
        description: '',
        activity_date: new Date().toISOString().split('T')[0]
      });
      fetchApplication();
    } catch (err) {
      alert('Failed to log activity.');
    } finally {
      setAddingActivity(false);
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!newFollowup.title.trim() || !newFollowup.follow_up_date) return;

    setAddingFollowup(true);
    try {
      await applicationService.createFollowup(id, newFollowup);
      setNewFollowup({
        title: 'Check application status',
        follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      });
      fetchApplication();
    } catch (err) {
      alert('Failed to create follow-up.');
    } finally {
      setAddingFollowup(false);
    }
  };

  const handleToggleFollowup = async (followupId, currentCompleted) => {
    try {
      await applicationService.updateFollowup(followupId, { completed: !currentCompleted });
      fetchApplication();
    } catch (err) {
      alert('Failed to update follow-up.');
    }
  };

  const handleGenerateAiFollowup = async () => {
    setGeneratingAi(true);
    setAiFollowup(null);
    setCopied(false);

    try {
      const res = await applicationService.generateAIFollowup(id);
      setAiFollowup(res.followup_suggestion);
    } catch (err) {
      alert('Failed to generate AI follow-up message.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCopyAiMessage = () => {
    if (!aiFollowup) return;
    const textToCopy = `Subject: ${aiFollowup.subject}\n\n${aiFollowup.message_body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto w-full p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-brand-rose mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Application Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/applications')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
          >
            Back to Application Tracker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 z-10 space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/applications')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-800 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tracker Pipeline</span>
          </button>

          {appData.job_url && appData.job_url !== '#' && (
            <a
              href={appData.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-all"
            >
              <span>View Job Posting</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* 1. Header Information Banner */}
        <div className="glass-panel p-6 md:p-8 border border-slate-800/90 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 text-xs font-mono font-bold">
                  {appData.current_stage}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
                  {appData.status}
                </span>
                {appData.match_percentage > 0 && (
                  <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                    {appData.match_percentage}% AI Match
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {appData.job_title}
              </h1>
              <p className="text-xs text-slate-300 font-semibold flex items-center space-x-3 mt-1">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>{appData.company_name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{appData.location}</span>
                </span>
                {appData.salary_range && (
                  <>
                    <span>•</span>
                    <span className="flex items-center space-x-1 text-emerald-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{appData.salary_range}</span>
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Stage Selector */}
            <div className="flex flex-col space-y-1.5 shrink-0">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Change Stage</label>
              <select
                value={appData.current_stage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-indigo cursor-pointer"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. AI Follow-Up Assistant Section */}
        <div className="glass-panel p-6 border border-brand-indigo/30 bg-brand-indigo/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>AI Follow-Up Assistant</span>
            </h3>

            <button
              onClick={handleGenerateAiFollowup}
              disabled={generatingAi}
              className="px-4 py-2 bg-gradient-to-r from-brand-indigo to-brand-cyan text-white text-xs font-bold rounded-xl shadow-md glow-cyan-sm flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
            >
              {generatingAi ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>Generate AI Follow-Up Email ✉️</span>
            </button>
          </div>

          {aiFollowup && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white">Subject: {aiFollowup.subject}</span>
                <button
                  onClick={handleCopyAiMessage}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-brand-cyan font-mono text-[11px] rounded-md border border-slate-800 flex items-center space-x-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {aiFollowup.message_body}
              </p>
            </div>
          )}
        </div>

        {/* 3. Split Grid: Timeline Activity Feed vs Scheduled Follow-Ups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Activities Feed */}
          <div className="glass-panel p-6 border border-slate-800 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-brand-cyan" />
              <span>Timeline Activities ({appData.activities?.length || 0})</span>
            </h3>

            {/* Log Activity Form */}
            <form onSubmit={handleAddActivity} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  placeholder="Activity Title (e.g. Technical Interview)"
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-indigo"
                />

                <select
                  value={newActivity.activity_type}
                  onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-indigo font-medium"
                >
                  <option value="Application">Application</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Interview">Interview</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejection">Rejection</option>
                  <option value="Note">Note</option>
                </select>
              </div>

              <textarea
                rows={2}
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                placeholder="Details or notes about this activity..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-indigo"
              />

              <button
                type="submit"
                disabled={addingActivity}
                className="px-4 py-2 bg-brand-indigo hover:bg-brand-indigo/90 text-white font-bold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {addingActivity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Log Activity</span>
              </button>
            </form>

            {/* Activities List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(appData.activities || []).map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-mono">
                        {act.activity_type}
                      </span>
                      <span>{act.title}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{act.activity_date}</span>
                  </div>
                  {act.description && <p className="text-slate-400 leading-relaxed text-[11px]">{act.description}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled Follow-ups */}
          <div className="glass-panel p-6 border border-slate-800 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-brand-indigo" />
              <span>Scheduled Follow-Ups ({appData.followups?.length || 0})</span>
            </h3>

            {/* Create Follow-Up Form */}
            <form onSubmit={handleAddFollowup} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newFollowup.title}
                  onChange={(e) => setNewFollowup({ ...newFollowup, title: e.target.value })}
                  placeholder="Follow-up Title"
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-indigo"
                />

                <input
                  type="date"
                  required
                  value={newFollowup.follow_up_date}
                  onChange={(e) => setNewFollowup({ ...newFollowup, follow_up_date: e.target.value })}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-indigo font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={addingFollowup}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {addingFollowup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add Follow-Up Reminder</span>
              </button>
            </form>

            {/* Follow-ups Checklist */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(appData.followups || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  No scheduled follow-up reminders.
                </p>
              ) : (
                (appData.followups || []).map((fu) => (
                  <div
                    key={fu.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between space-x-3 transition-all ${
                      fu.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={fu.completed}
                        onChange={() => handleToggleFollowup(fu.id, fu.completed)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                      />
                      <div>
                        <h4 className={`font-bold ${fu.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                          {fu.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">Date: {fu.follow_up_date}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      fu.completed ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {fu.completed ? 'Completed ✓' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Job Application Management System.
      </footer>
    </div>
  );
}
