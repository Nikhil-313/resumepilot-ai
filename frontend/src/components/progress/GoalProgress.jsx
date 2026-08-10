import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export default function GoalProgress({ goals = [] }) {
  const navigate = useNavigate();

  if (!goals || goals.length === 0) {
    return (
      <div className="glass-panel p-6 border border-slate-800 text-center text-xs text-slate-500 italic">
        No career goals set yet. <button onClick={() => navigate('/career')} className="text-brand-cyan hover:underline font-bold">Open Career Planner</button> to define goals.
      </div>
    );
  }

  const shortTerm = goals.filter(g => g.category === 'Short-term');
  const mediumTerm = goals.filter(g => g.category === 'Medium-term');
  const longTerm = goals.filter(g => g.category === 'Long-term' || (g.category !== 'Short-term' && g.category !== 'Medium-term'));

  const renderGoalGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">{title} ({items.length})</h4>
        <div className="space-y-2">
          {items.map((g) => {
            const isDone = g.status === 'completed';
            const isProgress = g.status === 'in_progress';
            return (
              <div key={g.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      isProgress ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {g.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="font-bold text-white">{g.title}</span>
                  </div>
                  {g.target_date && <p className="text-[10px] font-mono text-slate-500">Target: {g.target_date}</p>}
                </div>

                <button
                  onClick={() => navigate('/career')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-brand-cyan transition-colors"
                  title="View in Career Planner"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Target className="w-4 h-4 text-brand-cyan" />
          <span>Career Goal Execution ({goals.length})</span>
        </h3>

        <button
          onClick={() => navigate('/career')}
          className="text-[11px] font-mono text-brand-cyan hover:underline flex items-center space-x-1"
        >
          <span>Manage Goals</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-4">
        {renderGoalGroup("Short-Term Goals", shortTerm)}
        {renderGoalGroup("Medium-Term Goals", mediumTerm)}
        {renderGoalGroup("Long-Term Goals", longTerm)}
      </div>
    </div>
  );
}
