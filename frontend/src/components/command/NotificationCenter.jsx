import React from 'react';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Clock } from 'lucide-react';

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onDelete
}) {
  return (
    <div className="glass-panel p-6 border border-slate-800 space-y-4">
      {/* Header with Unread Count & Mark All Read */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-brand-cyan" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Smart Notifications & Alerts
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] font-mono text-brand-cyan hover:underline flex items-center space-x-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/60 rounded-xl border border-slate-800/80">
          No notifications or system alerts.
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                !n.is_read
                  ? 'bg-slate-950 border-brand-indigo/50 ring-1 ring-brand-indigo/30'
                  : 'bg-slate-950/50 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    n.priority === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                  }`}>
                    {n.notification_type}
                  </span>
                  <h4 className={`font-bold ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                    {n.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead && onMarkRead(n.id)}
                      className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Mark as Read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onDelete && onDelete(n.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                {n.message}
              </p>

              <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1 pt-1">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
