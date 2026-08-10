import React from 'react';
import { Target, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdaptivePracticePlan({ recommendations = [], onUpdateStatus }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="glass-panel p-6 border border-slate-800 text-center text-xs text-slate-500 italic">
        No pending practice recommendations. Complete evaluated mock interviews to generate adaptive practice plans!
      </div>
    );
  }

  const getPriorityBadge = (prio) => {
    if (prio === 'High') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (prio === 'Medium') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  };

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Target className="w-4 h-4 text-brand-indigo" />
          <span>Adaptive Interview Practice Plan ({recommendations.length})</span>
        </h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border space-y-2.5 transition-all ${
              item.status === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70'
                : item.status === 'dismissed'
                ? 'bg-slate-950/40 border-slate-800/60 opacity-50'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getPriorityBadge(item.priority)}`}>
                  {item.priority} Priority
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono">
                  {item.category}
                </span>
              </div>

              {/* Status Dropdown */}
              <select
                value={item.status}
                onChange={(e) => onUpdateStatus && onUpdateStatus(item.id, e.target.value)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-brand-indigo cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed ✓</option>
                <option value="dismissed">Dismissed ✕</option>
              </select>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{item.description}</p>
            </div>

            {item.reason && (
              <p className="text-[10px] font-mono text-slate-500">
                💡 Why: {item.reason}
              </p>
            )}

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-brand-cyan font-sans flex items-start space-x-2">
              <span className="font-bold shrink-0">Target Action:</span>
              <span>{item.recommended_action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
