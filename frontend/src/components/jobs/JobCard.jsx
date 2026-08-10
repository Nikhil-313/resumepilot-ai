import React from 'react';
import { Building2, MapPin, Briefcase, DollarSign, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, Eye } from 'lucide-react';

export default function JobCard({ job, onViewReport, onApply }) {
  const matchScore = job.match_percentage || 0;

  const getMatchBadgeStyle = (score) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 glow-emerald-sm';
    if (score >= 60) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (score > 0) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-900 text-slate-400 border-slate-800';
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

      {/* Card Actions Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
        {job.match_report_id ? (
          <button
            type="button"
            onClick={() => onViewReport && onViewReport(job.match_report_id, job)}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Match Report</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onViewReport && onViewReport(null, job)}
            className="flex-1 py-2 px-3 bg-brand-indigo/20 hover:bg-brand-indigo/30 text-brand-cyan text-xs font-semibold rounded-xl border border-brand-indigo/30 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Match Scan</span>
          </button>
        )}

        <a
          href={job.apply_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!job.apply_url || job.apply_url === '#') {
              e.preventDefault();
              if (onApply) onApply(job);
            }
          }}
          className="py-2 px-4 bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md glow-cyan-sm flex items-center space-x-1.5 transition-all"
        >
          <span>Apply</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
