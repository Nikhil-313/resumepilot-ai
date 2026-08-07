import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { resumeService } from '../services/resumeService';
import {
  FileText,
  UploadCloud,
  Eye,
  Trash2,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  Target
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [parsingId, setParsingId] = useState(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await resumeService.getAllResumes();
      setResumes(data.resumes || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    setDeletingId(id);
    try {
      await resumeService.deleteResume(id);
      setResumes(resumes.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete resume.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleParse = async (id, e) => {
    e.stopPropagation();
    setParsingId(id);
    try {
      await resumeService.parseResume(id);
      await fetchResumes();
    } catch (err) {
      alert(err.response?.data?.error || 'Parsing failed.');
    } finally {
      setParsingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 z-10">
        {/* Candidate Profile Header Card */}
        <div className="glass-panel p-6 md:p-8 mb-8 border border-slate-800/90 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Candidate Dashboard</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.full_name}!
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Manage your uploaded resumes, extract skills with Gemini AI, and prepare for interviews.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <Link
                to="/upload"
                className="px-5 py-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl shadow-lg glow-cyan-sm text-xs flex items-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Resume</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-500 block mb-1">TOTAL RESUMES</span>
              <span className="text-xl font-bold text-white">{resumes.length}</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-500 block mb-1">TARGET ROLE</span>
              <span className="text-sm font-semibold text-brand-cyan truncate block">
                {user?.target_role || 'Not specified'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-500 block mb-1">PARSED RESUMES</span>
              <span className="text-xl font-bold text-brand-emerald">
                {resumes.filter((r) => r.is_parsed).length}
              </span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-500 block mb-1">EXPERIENCE LEVEL</span>
              <span className="text-xs font-semibold text-slate-300 capitalize">
                {user?.experience_level || 'General'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-rose shrink-0" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* Resumes Grid Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-indigo" />
            <span>Uploaded Resumes</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Showing {resumes.length} document{resumes.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Shimmer Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-6 border border-slate-800 animate-pulse space-y-4">
                <div className="h-6 bg-slate-800 rounded-md w-3/4" />
                <div className="h-4 bg-slate-800/60 rounded-md w-1/2" />
                <div className="h-10 bg-slate-800/40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          /* Empty State */
          <div className="glass-panel p-12 text-center border border-slate-800/90 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
              <UploadCloud className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Resumes Uploaded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Upload your PDF resume to extract skills, compare against job descriptions, and prepare for interviews.
            </p>
            <Link
              to="/upload"
              className="px-6 py-3 bg-brand-indigo hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Your First Resume</span>
            </Link>
          </div>
        ) : (
          /* Resumes Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resumes.map((resume) => {
              const formattedDate = new Date(resume.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={resume.id}
                  onClick={() => navigate(`/resume/${resume.id}`)}
                  className="glass-panel glass-card-hover p-6 border border-slate-800/90 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Header & Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-brand-indigo" />
                        </div>
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-brand-cyan transition-colors">
                          {resume.filename}
                        </h3>
                      </div>

                      {resume.is_parsed ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Parsed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>Pending Parse</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-mono mb-4">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formattedDate}</span>
                      </span>
                      <span>{(resume.file_size / 1024).toFixed(1)} KB</span>
                    </div>

                    {/* Skill Tags Preview if parsed */}
                    {resume.parsed_json?.skills && (
                      <div className="flex flex-wrap gap-1.5 mb-4 max-h-16 overflow-hidden">
                        {resume.parsed_json.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.parsed_json.skills.length > 5 && (
                          <span className="text-[10px] text-slate-500 font-mono self-center">
                            +{resume.parsed_json.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {resume.is_parsed ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/resume/${resume.id}`);
                        }}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-all flex-1 justify-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleParse(resume.id, e)}
                        disabled={parsingId === resume.id}
                        className="px-3.5 py-2 bg-brand-indigo hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all flex-1 justify-center disabled:opacity-50"
                      >
                        {parsingId === resume.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Extract with AI</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(resume.id, e)}
                      disabled={deletingId === resume.id}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-all shrink-0"
                      title="Delete Resume"
                    >
                      {deletingId === resume.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        ResumePilot AI &copy; 2026. Candidate Dashboard.
      </footer>
    </div>
  );
}
