import React from 'react';
import { Target } from 'lucide-react';

export default function RoleSelector({ roles, selectedRole, onChange }) {
  return (
    <div>
      <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
        <Target className="w-4 h-4 text-brand-indigo" />
        <span>Target Role</span>
      </label>
      <select
        value={selectedRole}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-indigo transition-all cursor-pointer font-medium"
      >
        {roles.map((role) => (
          <option key={role} value={role} className="bg-slate-900 text-slate-100">
            {role}
          </option>
        ))}
      </select>
    </div>
  );
}
