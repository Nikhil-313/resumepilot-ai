import React from 'react';
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, PieChart, Percent, Briefcase } from 'lucide-react';

const STAGES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Final Round', 'Offer', 'Rejected', 'Withdrawn'];

export default function ApplicationAnalytics({ stats }) {
  if (!stats) return null;

  const {
    total_applications = 0,
    active_applications = 0,
    interviews = 0,
    offers = 0,
    rejections = 0,
    success_rate = 0.0,
    interview_conversion_rate = 0.0,
    stage_distribution = {},
    smart_recommendations = []
  } = stats;

  return (
    <div className="space-y-6">
      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="glass-panel p-3.5 border border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Total</span>
          <span className="text-xl font-bold text-white">{total_applications}</span>
        </div>

        <div className="glass-panel p-3.5 border border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Active</span>
          <span className="text-xl font-bold text-brand-cyan">{active_applications}</span>
        </div>

        <div className="glass-panel p-3.5 border border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Interviews</span>
          <span className="text-xl font-bold text-brand-indigo">{interviews}</span>
        </div>

        <div className="glass-panel p-3.5 border border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Offers</span>
          <span className="text-xl font-bold text-emerald-400">{offers}</span>
        </div>

        <div className="glass-panel p-3.5 border border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Rejected</span>
          <span className="text-xl font-bold text-rose-400">{rejections}</span>
        </div>

        <div className="glass-panel p-3.5 border border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Interview Rate</span>
          <span className="text-xl font-bold text-purple-400">{interview_conversion_rate}%</span>
        </div>

        <div className="glass-panel p-3.5 border border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Success Rate</span>
          <span className="text-xl font-bold text-emerald-300">{success_rate}%</span>
        </div>
      </div>

      {/* Stage Pipeline Distribution Visualizer */}
      <div className="glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <PieChart className="w-4 h-4 text-brand-cyan" />
          <span>Application Pipeline Distribution</span>
        </h3>

        <div className="space-y-3">
          {STAGES.map((stage) => {
            const count = stage_distribution[stage] || 0;
            const pct = total_applications > 0 ? roundPct((count / total_applications) * 100) : 0;

            const getStageBarColor = (s) => {
              if (s === 'Offer') return 'bg-emerald-500';
              if (s === 'Interview' || s === 'Final Round') return 'bg-brand-indigo';
              if (s === 'Assessment') return 'bg-purple-500';
              if (s === 'Applied') return 'bg-brand-cyan';
              if (s === 'Saved') return 'bg-slate-500';
              return 'bg-rose-500/70';
            };

            return (
              <div key={stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">{stage}</span>
                  <span className="text-slate-400">{count} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`${getStageBarColor(stage)} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Recommendations */}
      {smart_recommendations.length > 0 && (
        <div className="glass-panel p-6 border border-brand-indigo/30 bg-brand-indigo/5 space-y-3">
          <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-brand-cyan shrink-0" />
            <span>Smart Application Strategy Recommendations</span>
          </h3>

          <div className="space-y-2">
            {smart_recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2">
                <span className="px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan font-mono font-bold text-[10px] shrink-0">
                  Tip {idx + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function roundPct(val) {
  return Math.round(val);
}
