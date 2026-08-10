import React from 'react';
import { TrendingUp, Info } from 'lucide-react';

export default function ProgressTrendChart({ overall = {}, weekly = {} }) {
  const isLimited = !overall.score || overall.rating === 'Limited Data';

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-brand-cyan" />
          <span>Execution Progress & Performance Trends</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          Trend: {weekly.weekly_trend || 'Stable'}
        </span>
      </div>

      {isLimited ? (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-400 font-mono font-semibold">
            <Info className="w-4 h-4 shrink-0" />
            <span>Limited Activity Data</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Build more activity by advancing goals, completing roadmap skills, practicing mock interviews, and applying to jobs to establish progress trends.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Weekly Velocity Trend</span>
              <span className="text-white font-bold text-sm">{weekly.weekly_trend}</span>
            </div>

            <div className="flex items-center space-x-3 text-[11px]">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                Tasks Completed: {weekly.tasks_completed}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-brand-cyan">
                Tasks Remaining: {weekly.tasks_remaining}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
