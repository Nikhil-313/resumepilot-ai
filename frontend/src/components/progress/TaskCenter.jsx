import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2, ArrowRight, XCircle, Play } from 'lucide-react';

export default function TaskCenter({ tasks = [], onUpdateStatus }) {
  const navigate = useNavigate();

  if (!tasks || tasks.length === 0) {
    return (
      <div className="glass-panel p-6 border border-slate-800 text-center text-xs text-slate-500 italic">
        No active execution tasks. Synchronize actionable items to start tracking!
      </div>
    );
  }

  // Sort: High priority first, pending/in_progress first
  const sortedTasks = [...tasks].sort((a, b) => {
    const pOrder = { High: 1, Medium: 2, Low: 3 };
    const sOrder = { in_progress: 1, pending: 2, completed: 3, dismissed: 4 };

    if (sOrder[a.status] !== sOrder[b.status]) {
      return sOrder[a.status] - sOrder[b.status];
    }
    return pOrder[a.priority] - pOrder[b.priority];
  });

  const getSourceRoute = (cat) => {
    switch (cat) {
      case 'Career':
      case 'Skills': return '/career';
      case 'Interview': return '/interview-intelligence';
      case 'Resume': return '/resume-optimizer';
      case 'ATS': return '/ats';
      case 'Applications': return '/applications';
      case 'Jobs': return '/jobs';
      default: return '/command-center';
    }
  };

  const getPriorityBadge = (prio) => {
    if (prio === 'High') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (prio === 'Medium') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  };

  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Zap className="w-4 h-4 text-brand-cyan" />
          <span>Actionable Task Execution Center ({tasks.length})</span>
        </h3>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const isDone = task.status === 'completed';
          const isDismissed = task.status === 'dismissed';
          const route = getSourceRoute(task.category);

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                isDone ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70' :
                isDismissed ? 'bg-slate-950/40 border-slate-800/60 opacity-50' : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getPriorityBadge(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-brand-cyan text-[10px] font-mono">
                    {task.category}
                  </span>
                  {task.due_date && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Due: {task.due_date}
                    </span>
                  )}
                </div>

                {/* Status Controls */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  {!isDone && (
                    <button
                      onClick={() => onUpdateStatus && onUpdateStatus(task.id, 'completed')}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                      title="Mark Task Completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}

                  {!isDone && !isDismissed && (
                    <button
                      onClick={() => onUpdateStatus && onUpdateStatus(task.id, 'dismissed')}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Dismiss Task"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(route)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-brand-cyan rounded-lg text-[11px] font-semibold border border-slate-800 flex items-center space-x-1 transition-colors"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white">{task.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{task.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
