import React from 'react';
import { Filter, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const ROLES = [
  'All Roles',
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Product Manager'
];

const EXPERIENCE_LEVELS = [
  'All Levels',
  'Fresher / Student',
  'Entry Level',
  'Mid Level',
  'Senior Level'
];

export default function JobFilters({
  role,
  setRole,
  location,
  setLocation,
  expLevel,
  setExpLevel,
  minMatch,
  setMinMatch,
  sortBy,
  setSortBy,
  onReset
}) {
  return (
    <div className="glass-panel p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Filter className="w-4 h-4 text-brand-cyan" />
          <span>Filter & Search Opportunities</span>
        </h3>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-slate-400 hover:text-brand-cyan font-mono transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Role Filter Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo font-medium"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-slate-900 text-slate-100">
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Location</label>
          <div className="relative">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote, NY"
              className="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Experience Level Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Experience Level</label>
          <select
            value={expLevel}
            onChange={(e) => setExpLevel(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo font-medium"
          >
            {EXPERIENCE_LEVELS.map((exp) => (
              <option key={exp} value={exp} className="bg-slate-900 text-slate-100">
                {exp}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Match % Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-400">Min Match</label>
            <span className="text-[11px] font-mono text-brand-cyan font-bold">{minMatch}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={minMatch}
            onChange={(e) => setMinMatch(Number(e.target.value))}
            className="w-full accent-brand-cyan cursor-pointer h-2 bg-slate-950 rounded-lg border border-slate-800"
          />
        </div>

        {/* Sort Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span>Sort By</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo font-medium"
          >
            <option value="match_score" className="bg-slate-900 text-slate-100">Match Percentage</option>
            <option value="company" className="bg-slate-900 text-slate-100">Company Name</option>
            <option value="role" className="bg-slate-900 text-slate-100">Job Title</option>
          </select>
        </div>
      </div>
    </div>
  );
}
