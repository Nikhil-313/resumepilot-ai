import React, { useState } from 'react';
import { Building2, MapPin, Briefcase, DollarSign, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, Eye, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { isValidApplyUrl } from '../../utils/urlUtils';

export default function JobCard({ job, onViewReport, onApply }) {
  const matchScore = job.match_percentage || 0;
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);
  const [trackMsg, setTrackMsg] = useState('');

  const canApply = isValidApplyUrl(job.apply_url);

  const getMatchBadgeStyle = (score) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 glow-emerald-sm';
    if (score >= 60) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (score > 0) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-900 text-slate-400 border-slate-800';
  };

  const handleTrackApplication = async (e) => {
    e.stopPropagation();
    setTracking(true);
    setTrackMsg('');

    try {
      const res = await applicationService.createFromJob(job.id);
      setTracked(true);
      setTrackMsg(res.already_exists ? 'Already in Tracker ✓' : 'Application added to tracker ✓');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to track application.');
    } finally {
      setTracking(false);
    }
  };

  return (
    <div className="glass-panel glass-card-hover p-6 border border-slate-800/90 flex flex-col justify-between group relative">
      <div>
        {/* Header Row: Title, Company, & Match Percentage Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider block mb-1">
              {job.employment_type || 'Full-time'}
            </span>
            <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors leading-tight">
              {job.title}
            </h3>
            <p className="text-xs font-semibold text-slate-300 flex items-center space-x-1 mt-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.company}</span>
            </p>
          </div>

          <div className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold shrink-0 flex items-center space-x-1 ${getMatchBadgeStyle(matchScore)}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{matchScore > 0 ? `${matchScore}% Match` : 'Unmatched'}</span>
          </div>
        </div>

        {/* Job Meta Badges */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-400 font-mono mb-4">
          <span className="flex items-center space-x-1 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{job.location}</span>
          </span>

          <span className="flex items-center space-x-1 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span>{job.experience_level}</span>
          </span>

          {job.salary_range && (
            <span className="flex items-center space-x-1 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-300">{job.salary_range}</span>
            </span>
          )}
        </div>

        {/* Description Snippet */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Matching Skills vs Missing Skills */}
        <div className="space-y-2 mb-4">
          {job.matching_skills && job.matching_skills.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold block mb-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Matching Skills ({job.matching_skills.length})</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {job.matching_skills.slice(0, 4).map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                    {skill}
                  </span>
                ))}
                {job.matching_skills.length > 4 && (
                  <span className="text-[10px] text-slate-500 font-mono self-center">
                    +{job.matching_skills.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {job.missing_skills && job.missing_skills.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-semibold block mb-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Missing Skills ({job.missing_skills.length})</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {job.missing_skills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                    + {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracked Toast Notification */}
      {trackMsg && (
        <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] text-center font-mono font-semibold">
          {trackMsg}
        </div>
      )}

      {/* Card Actions Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={handleTrackApplication}
          disabled={tracking || tracked}
          className={`w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            tracked
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          {tracking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />
          ) : tracked ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <BookmarkPlus className="w-3.5 h-3.5 text-brand-indigo" />
          )}
          <span>{tracked ? 'Tracked ✓' : 'Track Application'}</span>
        </button>

        {job.match_report_id ? (
          <button
            type="button"
            onClick={() => onViewReport && onViewReport(job.match_report_id, job)}
            className="flex-1 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Match Report</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onViewReport && onViewReport(null, job)}
            className="flex-1 w-full py-2 px-3 bg-brand-indigo/20 hover:bg-brand-indigo/30 text-brand-cyan text-xs font-semibold rounded-xl border border-brand-indigo/30 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Match Scan</span>
          </button>
        )}

        {canApply ? (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md glow-cyan-sm flex items-center justify-center space-x-1 transition-all"
          >
            <span>Apply</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Application link unavailable for this demo job"
            className="py-2 px-3 bg-slate-900/90 border border-slate-800 text-slate-500 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1 cursor-not-allowed opacity-75 shrink-0"
          >
            <span>Apply Link Unavailable</span>
          </button>
        )}
      </div>
    </div>
  );
}
