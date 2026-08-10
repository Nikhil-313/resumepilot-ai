import React from 'react';
import { TrendingUp, Info } from 'lucide-react';

export default function InterviewTrendChart({ trends = [] }) {
  if (!trends || trends.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800">
        No evaluation data available to chart trends.
      </div>
    );
  }

  const isSingleSession = trends.length === 1;

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-brand-cyan" />
          <span>Chronological Interview Performance Trends</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          {trends.length} Evaluated Session(s)
        </span>
      </div>

      {isSingleSession ? (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-400 font-mono font-semibold">
            <Info className="w-4 h-4 shrink-0" />
            <span>Single Session Evaluated ({trends[0].date})</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Overall Score: <strong>{trends[0].overall}%</strong> • Technical: <strong>{trends[0].technical}%</strong> • Communication: <strong>{trends[0].communication}%</strong>
          </p>
          <p className="text-slate-500 italic text-[10px] pt-1 border-t border-slate-900">
            More mock interview sessions are needed to establish long-term performance trends.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {/* Custom Lightweight Bar & Score Progression */}
          <div className="grid grid-cols-1 gap-2.5">
            {trends.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded bg-brand-indigo/20 text-brand-indigo font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white">{item.date}</span>
                    <span className="text-[11px] text-slate-400 block">Session Overall Score: {item.overall}%</span>
                  </div>
                </div>

                {/* Sub-scores Progression */}
                <div className="flex items-center space-x-2 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-brand-cyan">
                    Tech: {item.technical}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-brand-indigo">
                    Comm: {item.communication}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400">
                    Prob: {item.problem_solving}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                    Conf: {item.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
