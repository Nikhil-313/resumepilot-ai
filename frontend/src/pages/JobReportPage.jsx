import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { jobService } from '../services/jobService';
import { isValidApplyUrl } from '../utils/urlUtils';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  BookOpen,
  Check,
  TrendingUp
} from 'lucide-react';

export default function JobReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await jobService.getMatchReportById(id);
        setReport(data.report);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch job match report.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mb-4" />
          <p className="text-slate-400 text-xs font-mono">Generating AI job compatibility report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto w-full p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-brand-rose mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
          >
            Back to Job Matches
          </button>
        </div>
      </div>
    );
  }

  const job = report.job || {};
  const matchPercentage = report.match_percentage || 0;
  const canApply = isValidApplyUrl(job.apply_url);

  const getMatchBadgeStyle = (score) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 z-10 print:p-0 print:max-w-none">
        {/* Navigation & Header Actions */}
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-800 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Recommended Jobs</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {canApply ? (
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg glow-cyan-sm flex items-center space-x-1.5 transition-all"
              >
                <span>Apply for Position</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Application link unavailable for this demo job"
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-500 font-semibold rounded-xl text-xs flex items-center space-x-1.5 cursor-not-allowed opacity-75"
              >
                <span>Apply Link Unavailable</span>
              </button>
            )}
          </div>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-black">ResumePilot AI - Job Compatibility Evaluation</h1>
          <p className="text-sm text-gray-600">{job.title} at {job.company}</p>
        </div>

        {/* 1. Top Match Score Banner */}
        <div className="glass-panel p-6 md:p-8 mb-6 border border-slate-800/90 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-brand-cyan flex flex-col items-center justify-center shrink-0 shadow-lg glow-cyan-sm">
                <span className="text-3xl font-extrabold text-white">{matchPercentage}%</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">MATCH SCORE</span>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getMatchBadgeStyle(matchPercentage)}`}>
                    {matchPercentage >= 80 ? 'High Compatibility' : matchPercentage >= 60 ? 'Moderate Compatibility' : 'Low Compatibility'}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {job.title}
                </h1>
                <p className="text-xs text-slate-300 font-semibold flex items-center space-x-3 mt-1">
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>{job.company}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.experience_level}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Metrics Breakdown Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Experience Match</span>
              <span className="text-sm font-bold text-brand-cyan">{report.experience_match || 'Moderate'}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Education Match</span>
              <span className="text-sm font-bold text-brand-indigo">{report.education_match || 'High'}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Certification Match</span>
              <span className="text-sm font-bold text-brand-emerald">{report.certification_match || 'Moderate'}</span>
            </div>
          </div>
        </div>

        {/* 2. AI Career Fit Explanation */}
        {report.ai_career_fit_explanation && (
          <div className="glass-panel p-6 border border-brand-indigo/30 bg-brand-indigo/5 mb-6">
            <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>AI Career Fit Evaluation</span>
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {report.ai_career_fit_explanation}
            </p>
          </div>
        )}

        {/* 3. Matching & Missing Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-panel p-5 border border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
              <span>Matching Candidate Skills ({report.matching_skills?.length || 0})</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(report.matching_skills || []).map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 border border-amber-500/20 bg-amber-500/5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-brand-amber shrink-0" />
              <span>Missing Role Skills ({report.missing_skills?.length || 0})</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(report.missing_skills || []).map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                  + {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Candidate Strengths & Areas to Improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-panel p-6 border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Award className="w-4 h-4 text-brand-cyan shrink-0" />
              <span>Candidate Strengths for this Position</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {(report.strengths || []).map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brand-cyan font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-6 border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-brand-amber shrink-0" />
              <span>Gaps & Areas to Improve</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {(report.areas_to_improve || []).map((gap, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brand-amber font-bold">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 5. Personalized AI Learning Roadmap */}
        {report.recommended_learning_path && report.recommended_learning_path.length > 0 && (
          <div className="glass-panel p-6 border border-slate-800 mb-8">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-brand-indigo shrink-0" />
              <span>Personalized AI Learning Roadmap to Bridge Skill Gaps</span>
            </h3>

            <div className="space-y-3">
              {report.recommended_learning_path.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-indigo/20 text-brand-indigo font-mono font-bold flex items-center justify-center shrink-0">
                      #{item.step || idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white mb-0.5">Target Skill: {item.skill}</h4>
                      <p className="text-slate-400">{item.action}</p>
                    </div>
                  </div>

                  {item.estimated_time && (
                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-brand-cyan shrink-0">
                      Est. {item.estimated_time}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900 print:hidden">
        ResumePilot AI &copy; 2026. AI Job Compatibility Evaluation Engine.
      </footer>
    </div>
  );
}
