import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Notification } from '../types';
import { cn } from '@/lib/utils';

interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
  info: <AlertCircle className="w-4 h-4 text-blue-400" />,
};

const TOAST_STYLES: Record<string, { border: string; bg: string }> = {
  success: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5' },
  error: { border: 'border-l-red-500', bg: 'bg-red-500/5' },
  warning: { border: 'border-l-amber-500', bg: 'bg-amber-500/5' },
  info: { border: 'border-l-blue-500', bg: 'bg-blue-500/5' },
};

const DISMISS_DELAYS: Record<string, number> = {
  success: 4000,
  info: 4500,
  warning: 6000,
  error: 8000,
};

function Toast({ notification, onDismiss }: { notification: Notification; onDismiss: (id: string) => void }) {
  const style = TOAST_STYLES[notification.type];
  const delay = DISMISS_DELAYS[notification.type];

  return (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'glass-panel rounded-xl border border-white/10 w-80 shadow-2xl',
        'border-l-[3px] relative overflow-hidden',
        style.border,
        style.bg
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">{TOAST_ICONS[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white">{notification.title}</p>
            <p className="text-sm text-slate-300 mt-1 leading-snug">{notification.message}</p>
          </div>
          <button
            onClick={() => onDismiss(notification.id)}
            className="shrink-0 text-slate-400 hover:text-white transition-colors ml-2"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 h-[2px] bg-current opacity-30 rounded-b-xl',
          notification.type === 'success' && 'bg-emerald-500',
          notification.type === 'error' && 'bg-red-500',
          notification.type === 'warning' && 'bg-amber-500',
          notification.type === 'info' && 'bg-blue-500'
        )}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: delay / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export function ToastContainer({ notifications, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {notifications.map(n => (
          <Toast key={n.id} notification={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
