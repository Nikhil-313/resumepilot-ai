import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

export default function RecurringWeaknesses({ weaknesses = [] }) {
  if (!weaknesses || weaknesses.length === 0) {
    return (
      <div className="glass-panel p-6 border border-slate-800 text-center text-xs text-slate-500 italic">
        No recurring interview weaknesses detected.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span>Identified Recurring Weaknesses ({weaknesses.length})</span>
      </h3>

      <div className="space-y-3">
        {weaknesses.map((item, idx) => {
          const isTop = idx === 0;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-2 transition-all ${
                isTop
                  ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    item.severity === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.severity} Severity
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Appeared in {item.frequency}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  Last seen: {item.most_recent_occurrence}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white font-sans">
                {item.weakness}
              </h4>

              <p className="text-[11px] text-slate-300 italic flex items-center space-x-1.5 pt-1">
                <span className="text-amber-400 font-bold">💡 Recommended Practice:</span>
                <span>{item.recommended_action}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
