import React from 'react';
import { FileText, HelpCircle } from 'lucide-react';
import RoleSelector from './RoleSelector';
import DifficultySelector from './DifficultySelector';
import StartInterviewButton from './StartInterviewButton';

export default function InterviewCard({
  resumes,
  selectedResumeId,
  onResumeChange,
  roles,
  selectedRole,
  onRoleChange,
  difficulties,
  selectedDifficulty,
  onDifficultyChange,
  questionCount,
  onQuestionCountChange,
  onStart,
  loading,
}) {
  const questionOptions = [5, 10, 15];

  return (
    <div className="glass-panel p-6 md:p-10 border border-slate-800/90 shadow-2xl space-y-6">
      {/* 1. Resume Selection Dropdown */}
      <div>
        <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4 text-brand-emerald" />
          <span>Selected Resume</span>
        </label>
        {resumes.length === 0 ? (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-amber-400">
            No uploaded resumes found. Please upload a resume first.
          </div>
        ) : (
          <select
            value={selectedResumeId}
            onChange={(e) => onResumeChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo transition-all cursor-pointer font-medium"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                {r.filename} ({new Date(r.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 2. Target Role Selector */}
      <RoleSelector
        roles={roles}
        selectedRole={selectedRole}
        onChange={onRoleChange}
      />

      {/* 3. Difficulty Selector */}
      <DifficultySelector
        difficulties={difficulties}
        selectedDifficulty={selectedDifficulty}
        onChange={onDifficultyChange}
      />

      {/* 4. Number of Questions Selector */}
      <div>
        <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>Number of Questions</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {questionOptions.map((count) => {
            const selected = questionCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => onQuestionCountChange(count)}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                  selected
                    ? 'bg-purple-500/20 border-purple-500 text-white ring-1 ring-purple-500 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{count} Questions</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Start CTA Button */}
      <div className="pt-2">
        <StartInterviewButton
          onClick={onStart}
          loading={loading}
          disabled={resumes.length === 0}
        />
      </div>
    </div>
  );
}
