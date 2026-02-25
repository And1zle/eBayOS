import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Notification, NotificationType } from '../types';
import { ToastContainer } from '../components/ToastContainer';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (payload: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const DISMISS_DELAYS: Record<NotificationType, number> = {
  success: 4000,
  info: 4500,
  warning: 6000,
  error: 8000,
};

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<string[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(tid => tid !== id));
  }, []);

  const addNotification = useCallback((payload: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
      ...payload,
    };

    // Add to persistent list (keep max 20)
    setNotifications(prev => [notification, ...prev].slice(0, 20));

    // Add to toast queue (keep max 3 visible)
    setToasts(prev => {
      const next = [...prev, notification.id];
      return next.slice(-3);
    });

    // Auto-dismiss after variable delay based on type
    const delay = DISMISS_DELAYS[payload.type];
    setTimeout(() => {
      dismissToast(notification.id);
    }, delay);
  }, [dismissToast]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
    dismissToast,
  };

  const visibleToasts = notifications.filter(n => toasts.includes(n.id));

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <ToastContainer notifications={visibleToasts} onDismiss={dismissToast} />,
          document.body
        )}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
