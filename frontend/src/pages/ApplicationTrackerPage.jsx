import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ApplicationAnalytics from '../components/applications/ApplicationAnalytics';
import { applicationService } from '../services/applicationService';
import { resumeService } from '../services/resumeService';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  BarChart3,
  Kanban,
  Building2,
  Calendar,
  Sparkles,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const STAGES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Final Round', 'Offer', 'Rejected', 'Withdrawn'];
const ACTIVE_STAGES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Final Round', 'Offer'];

export default function ApplicationTrackerPage() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('updated_at');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'analytics'

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [savingApp, setSavingApp] = useState(false);
  const [newApp, setNewApp] = useState({
    job_title: '',
    company_name: '',
    location: 'Remote',
    employment_type: 'Full-time',
    job_url: '',
    salary_range: '',
    application_date: new Date().toISOString().split('T')[0],
    current_stage: 'Applied',
    notes: '',
    resume_id: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        stage: stageFilter !== 'All Stages' ? stageFilter : undefined,
        status: statusFilter !== 'All Statuses' ? statusFilter : undefined,
        sort_by: sortBy
      };

      const [appsData, statsData, resumeData] = await Promise.all([
        applicationService.getApplications(params),
        applicationService.getStatistics().catch(() => ({ statistics: null })),
        resumeService.getAllResumes().catch(() => ({ resumes: [] }))
      ]);

      setApplications(appsData.applications || []);
      setStats(statsData.statistics);
      const userResumes = resumeData.resumes || [];
      setResumes(userResumes);
      if (userResumes.length > 0 && !newApp.resume_id) {
        setNewApp((prev) => ({ ...prev, resume_id: userResumes[0].id }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch job applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, stageFilter, statusFilter, sortBy]);

  const handleCreateManualApp = async (e) => {
    e.preventDefault();
    if (!newApp.job_title || !newApp.company_name) {
      alert('Job Title and Company Name are required.');
      return;
    }

    setSavingApp(true);
    try {
      await applicationService.createManual(newApp);
      setShowAddModal(false);
      setNewApp({
        job_title: '',
        company_name: '',
        location: 'Remote',
        employment_type: 'Full-time',
        job_url: '',
        salary_range: '',
        application_date: new Date().toISOString().split('T')[0],
        current_stage: 'Applied',
        notes: '',
        resume_id: resumes.length > 0 ? resumes[0].id : ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create application.');
    } finally {
      setSavingApp(false);
    }
  };

  const handleStageChange = async (appId, newStage, e) => {
    e.stopPropagation();
    try {
      await applicationService.updateStage(appId, newStage);
      fetchData();
    } catch (err) {
      alert('Failed to update stage.');
    }
  };

  const handleDeleteApp = async (appId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this job application?')) return;

    try {
      await applicationService.deleteApplication(appId);
      fetchData();
    } catch (err) {
      alert('Failed to delete application.');
    }
  };

  const getStageBadgeStyle = (stage) => {
    if (stage === 'Offer') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (stage === 'Interview' || stage === 'Final Round') return 'bg-brand-indigo/20 text-white border-brand-indigo/40';
    if (stage === 'Assessment') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (stage === 'Applied') return 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30';
    if (stage === 'Rejected') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (stage === 'Withdrawn') return 'bg-slate-800 text-slate-400 border-slate-700';
    return 'bg-slate-900 text-slate-300 border-slate-800';
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10">
        {/* Header Banner */}
        <div className="glass-panel p-6 md:p-8 mb-8 border border-slate-800/90 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
              <Briefcase className="w-3.5 h-3.5" />
              <span>AI Job Application Tracker</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Job Application Management Studio
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Track applications, log interview assessments, set follow-up reminders, and view smart conversion analytics.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Toggle View Mode */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  viewMode === 'kanban' ? 'bg-brand-indigo text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Pipeline</span>
              </button>

              <button
                onClick={() => setViewMode('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  viewMode === 'analytics' ? 'bg-brand-indigo text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* View Mode: Analytics Dashboard */}
        {viewMode === 'analytics' ? (
          <div className="mb-8">
            <ApplicationAnalytics stats={stats} />
          </div>
        ) : (
          /* View Mode: Kanban Pipeline Workspace */
          <div className="space-y-6">
            {/* Filter Controls Bar */}
            <div className="glass-panel p-4 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search job title or company..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo cursor-pointer font-medium"
              >
                <option value="All Stages">All Stages</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo cursor-pointer font-medium"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Successful">Successful (Offers)</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo cursor-pointer font-medium"
              >
                <option value="updated_at">Recently Updated</option>
                <option value="application_date">Application Date</option>
                <option value="match_percentage">AI Match Percentage</option>
                <option value="company">Company Name</option>
              </select>
            </div>

            {loading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
                <p className="text-xs text-slate-500 font-mono">Loading application pipeline...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="glass-panel p-12 text-center border border-slate-800/90 flex flex-col items-center justify-center my-6">
                <Briefcase className="w-10 h-10 text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No Applications Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Track jobs from the <strong>Job Matches</strong> module or click <strong>"Add Application"</strong> to create a manual entry.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-indigo to-brand-cyan text-white font-bold rounded-xl text-xs"
                >
                  + Add Manual Application
                </button>
              </div>
            ) : (
              /* Kanban Pipeline Stage Columns */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
                {ACTIVE_STAGES.map((st) => {
                  const stageApps = applications.filter((a) => a.current_stage === st);

                  return (
                    <div key={st} className="glass-panel p-3.5 border border-slate-800 flex flex-col space-y-3 min-w-[220px]">
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{st}</span>
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-brand-cyan flex items-center justify-center font-bold">
                          {stageApps.length}
                        </span>
                      </div>

                      {/* Application Cards List */}
                      <div className="space-y-3 flex-1">
                        {stageApps.map((app) => (
                          <div
                            key={app.id}
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-brand-indigo/50 transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="font-bold text-xs text-white group-hover:text-brand-cyan transition-colors leading-tight">
                                  {app.job_title}
                                </h4>
                                <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 font-semibold">
                                  <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate">{app.company_name}</span>
                                </p>
                              </div>

                              {app.match_percentage > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[9px] font-mono font-bold shrink-0">
                                  {app.match_percentage}%
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{app.application_date || 'Recent'}</span>
                              </span>

                              <div className="flex items-center space-x-1">
                                <select
                                  value={app.current_stage}
                                  onChange={(e) => handleStageChange(app.id, e.target.value, e)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-300 focus:outline-none cursor-pointer"
                                >
                                  {STAGES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteApp(app.id, e)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Manual Application */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel max-w-lg w-full p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-brand-cyan" />
                  <span>Add Manual Job Application</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualApp} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={newApp.job_title}
                      onChange={(e) => setNewApp({ ...newApp, job_title: e.target.value })}
                      placeholder="e.g. Backend Developer"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newApp.company_name}
                      onChange={(e) => setNewApp({ ...newApp, company_name: e.target.value })}
                      placeholder="e.g. Stripe"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-indigo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Location</label>
                    <input
                      type="text"
                      value={newApp.location}
                      onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                      placeholder="e.g. Remote, San Francisco"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Initial Stage</label>
                    <select
                      value={newApp.current_stage}
                      onChange={(e) => setNewApp({ ...newApp, current_stage: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-indigo cursor-pointer font-medium"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={newApp.salary_range}
                      onChange={(e) => setNewApp({ ...newApp, salary_range: e.target.value })}
                      placeholder="e.g. $120,000 - $140,000"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Job Link / URL</label>
                    <input
                      type="text"
                      value={newApp.job_url}
                      onChange={(e) => setNewApp({ ...newApp, job_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-indigo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={newApp.notes}
                    onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                    placeholder="Recruiter contact, referral details, or notes..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-indigo"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingApp}
                    className="px-5 py-2 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl flex items-center space-x-2"
                  >
                    {savingApp ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Save Application</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Job Application Tracker & Management Studio.
      </footer>
    </div>
  );
}
