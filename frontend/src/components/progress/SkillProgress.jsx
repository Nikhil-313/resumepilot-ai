import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function SkillProgress({ skills = [] }) {
  const navigate = useNavigate();

  if (!skills || skills.length === 0) {
    return (
      <div className="glass-panel p-6 border border-slate-800 text-center text-xs text-slate-500 italic">
        No skill roadmap targets configured. <button onClick={() => navigate('/career')} className="text-brand-cyan hover:underline font-bold">Open Career Roadmap</button>.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Compass className="w-4 h-4 text-brand-indigo" />
          <span>Skill Roadmap Execution ({skills.length})</span>
        </h3>

        <button
          onClick={() => navigate('/career')}
          className="text-[11px] font-mono text-brand-cyan hover:underline flex items-center space-x-1"
        >
          <span>Open Roadmap</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2.5">
        {skills.map((s) => {
          const isDone = s.status === 'completed';
          return (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                isDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{s.skill_name}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-brand-cyan text-[10px] font-mono">
                    {s.current_level} → {s.target_level}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">Est: {s.estimated_time || '2 weeks'}</p>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {s.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
