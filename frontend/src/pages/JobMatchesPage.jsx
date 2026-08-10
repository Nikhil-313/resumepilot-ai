import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import JobCard from '../components/jobs/JobCard';
import JobFilters from '../components/jobs/JobFilters';
import { jobService } from '../services/jobService';
import { isValidApplyUrl } from '../utils/urlUtils';
import {
  Sparkles,
  Briefcase,
  Loader2,
  AlertCircle,
  Cpu,
  History,
  Eye,
  Trash2,
  Calendar,
  Building2
} from 'lucide-react';

export default function JobMatchesPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Filter States
  const [role, setRole] = useState('All Roles');
  const [location, setLocation] = useState('');
  const [expLevel, setExpLevel] = useState('All Levels');
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState('match_score');

  // Match Reports History
  const [matchReports, setMatchReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const params = {
        role: role !== 'All Roles' ? role : undefined,
        location: location.trim() || undefined,
        experience_level: expLevel !== 'All Levels' ? expLevel : undefined,
        min_match: minMatch > 0 ? minMatch : undefined,
        sort_by: sortBy
      };

      const data = await jobService.getJobs(params);
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch job opportunities.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await jobService.getMatchReports();
      setMatchReports(data.matches || []);
    } catch (err) {
      console.error('Failed to fetch job match history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchHistory();
  }, [role, location, expLevel, minMatch, sortBy]);

  const handleGenerateMatches = async () => {
    setGenerating(true);
    setError('');

    try {
      await jobService.generateMatches({});
      await Promise.all([fetchJobs(), fetchHistory()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate AI job matches.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this job match report?')) return;

    setDeletingId(reportId);
    try {
      await jobService.deleteMatchReport(reportId);
      await Promise.all([fetchJobs(), fetchHistory()]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewReport = (reportId, job) => {
    if (reportId) {
      navigate(`/jobs/match/${reportId}`);
    } else {
      handleGenerateMatches();
    }
  };

  const handleResetFilters = () => {
    setRole('All Roles');
    setLocation('');
    setExpLevel('All Levels');
    setMinMatch(0);
    setSortBy('match_score');
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10">
        {/* Header Banner */}
        <div className="glass-panel p-6 md:p-8 mb-8 border border-slate-800/90 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Job Matchmaker & Career Copilot</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Recommended Opportunities & Career Fit
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Compare your candidate profile, parsed resume skills, ATS compatibility, and interview performance against active job postings using Gemini AI.
            </p>
          </div>

          <button
            onClick={handleGenerateMatches}
            disabled={generating}
            className="px-6 py-3.5 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-lg glow-cyan-sm text-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running Gemini AI Matcher...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Job Matches</span>
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* Generating AI Match State */}
        {generating && (
          <div className="glass-panel p-8 text-center border border-slate-800 flex flex-col items-center justify-center my-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg glow-cyan-sm mb-4 animate-pulse">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Evaluating Career Match Compatibility...</h3>
            <p className="text-xs text-brand-cyan font-mono animate-pulse mb-3">
              Gemini AI analyzing candidate skills, target role, and experience alignment...
            </p>
            <div className="w-full max-w-xs bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-brand-indigo to-brand-cyan h-2 rounded-full animate-pulse-slow w-full" />
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6">
          <JobFilters
            role={role}
            setRole={setRole}
            location={location}
            setLocation={setLocation}
            expLevel={expLevel}
            setExpLevel={setExpLevel}
            minMatch={minMatch}
            setMinMatch={setMinMatch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onReset={handleResetFilters}
          />
        </div>

        {/* Jobs Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-brand-cyan" />
              <span>Matched Opportunities ({jobs.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Showing filtered jobs
            </span>
          </div>

          {loadingJobs ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-cyan animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-mono">Loading job opportunities...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass-panel p-12 text-center border border-slate-800/80">
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Matching Jobs Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                No job opportunities match your current filter criteria. Try adjusting your role, location, or minimum match percentage.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewReport={handleViewReport}
                  onApply={(j) => {
                    if (isValidApplyUrl(j.apply_url)) {
                      window.open(j.apply_url, '_blank');
                    } else {
                      alert('Application link unavailable for this demo job.');
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Match Reports History Section */}
        <div className="glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <History className="w-4 h-4 text-brand-indigo" />
              <span>AI Job Match Evaluation History ({matchReports.length})</span>
            </h2>
            {loadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />}
          </div>

          {matchReports.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800/80">
              No saved job match reports found. Click "Generate AI Job Matches" above to evaluate your profile!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {matchReports.map((item) => {
                const jobInfo = item.job || {};
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/jobs/match/${item.id}`)}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="font-bold text-white group-hover:text-brand-cyan transition-colors truncate">
                          {jobInfo.title || 'Job Role'}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-mono font-bold shrink-0">
                          {item.match_percentage}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{jobInfo.company || 'Company'}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/match/${item.id}`);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteReport(item.id, e)}
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
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. AI Job Matching & Personalized Career Recommendations.
      </footer>
    </div>
  );
}
