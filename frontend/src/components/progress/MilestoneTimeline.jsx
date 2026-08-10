import React from 'react';
import { Award, CheckCircle2, Clock, Calendar } from 'lucide-react';

export default function MilestoneTimeline({ milestones = [] }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="glass-panel p-6 border border-slate-800 text-center text-xs text-slate-500 italic">
        No progress milestones calculated yet. Complete career goals to unlock milestone achievements!
      </div>
    );
  }

  const getStatusBadge = (st) => {
    if (st === 'completed') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (st === 'in_progress') return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    if (st === 'overdue') return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    return 'bg-slate-900 text-slate-400 border border-slate-800';
  };

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Award className="w-4 h-4 text-brand-cyan" />
          <span>Major Career Milestone Timeline ({milestones.length})</span>
        </h3>
      </div>

      <div className="relative border-l border-slate-800 ml-3 space-y-6 pl-6 pt-2">
        {milestones.map((m) => {
          const isDone = m.status === 'completed';
          return (
            <div key={m.id} className="relative space-y-1.5">
              {/* Timeline Bullet */}
              <div className={`absolute -left-[31px] top-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                isDone ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-slate-950 border-slate-700 text-slate-500'
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-slate-500" />}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getStatusBadge(m.status)}`}>
                    {m.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="font-bold text-white text-xs">{m.title}</span>
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  Target: {m.target_date}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">{m.description}</p>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800/80 overflow-hidden">
                <div
                  className={`h-full transition-all ${isDone ? 'bg-emerald-400' : 'bg-brand-cyan'}`}
                  style={{ width: `${m.completion_percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
