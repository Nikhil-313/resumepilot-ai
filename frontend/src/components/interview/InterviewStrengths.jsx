import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';

export default function InterviewStrengths({ strengths = [] }) {
  if (!strengths || strengths.length === 0) {
    return (
      <div className="glass-panel p-6 border border-slate-800 text-center text-xs text-slate-500 italic">
        No recurring strengths evaluated yet.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
        <Award className="w-4 h-4 text-brand-emerald" />
        <span>Verified Interview Strengths ({strengths.length})</span>
      </h3>

      <div className="space-y-3">
        {strengths.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                Appeared in {item.frequency}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Last seen: {item.most_recent_occurrence}
              </span>
            </div>

            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
              <span>{item.strength}</span>
            </h4>

            <p className="text-[10px] font-mono text-slate-400">
              Supporting Dimension: {item.supporting_dimension}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
