import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Target, Bot, Compass, Wand2, FolderCheck } from 'lucide-react';

export default function ActionCenter({ actions = [] }) {
  const navigate = useNavigate();

  if (!actions || actions.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800">
        No immediate high-priority actions required. Your career execution plan is up to date!
      </div>
    );
  }

  const getPriorityBadge = (prio) => {
    if (prio === 'High') return 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold';
    if (prio === 'Medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'ATS': return Target;
      case 'Interview': return Bot;
      case 'Skills':
      case 'Career': return Compass;
      case 'Resume': return Wand2;
      case 'Applications': return FolderCheck;
      default: return Sparkles;
    }
  };

  return (
    <div className="space-y-3">
      {actions.map((act) => {
        const Icon = getCategoryIcon(act.category);

        return (
          <div
            key={act.id || act.title}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-indigo/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-cyan shrink-0">
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(act.priority)}`}>
                    {act.priority} Priority
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono">
                    {act.category}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-brand-cyan transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => act.route && navigate(act.route)}
              className="px-4 py-2 bg-slate-800 hover:bg-brand-indigo text-slate-200 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 hover:border-brand-indigo flex items-center justify-center space-x-1.5 transition-all shrink-0 cursor-pointer"
            >
              <span>Take Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
