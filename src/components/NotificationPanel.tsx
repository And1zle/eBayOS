import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '@/lib/utils';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
  info: <AlertCircle className="w-4 h-4 text-blue-400" />,
};

export function NotificationPanel() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-[#0B0E14]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 mt-2 z-50 w-96"
          >
            <div className="glass-panel rounded-xl border border-white/5 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider font-mono"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[480px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-slate-500">
                    <Bell className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        'w-full px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left',
                        'flex items-start gap-3 group'
                      )}
                    >
                      {/* Unread dot */}
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                      {n.read && <div className="w-1.5 h-1.5 shrink-0 mt-1.5" />}

                      {/* Icon */}
                      <div className="shrink-0 mt-0.5">{NOTIFICATION_ICONS[n.type]}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', n.read ? 'text-slate-400' : 'text-white')}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-2">{formatRelativeTime(n.timestamp)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
