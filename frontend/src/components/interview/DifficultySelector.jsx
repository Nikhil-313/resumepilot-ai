import React from 'react';
import { Gauge, CheckCircle2 } from 'lucide-react';

export default function DifficultySelector({ difficulties, selectedDifficulty, onChange }) {
  return (
    <div>
      <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
        <Gauge className="w-4 h-4 text-brand-cyan" />
        <span>Difficulty Level</span>
      </label>
      <div className="grid grid-cols-3 gap-3">
        {difficulties.map((level) => {
          const selected = selectedDifficulty === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                selected
                  ? 'bg-brand-cyan/20 border-brand-cyan text-white ring-1 ring-brand-cyan shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{level}</span>
              {selected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
