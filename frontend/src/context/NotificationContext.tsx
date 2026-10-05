import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch existing notifications when user logs in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    api
      .get<Notification[]>('/notifications')
      .then((res) => setNotifications(res.data))
      .catch(() => {/* silently ignore — auth errors are handled globally */});
  }, [user]);

  // Listen for real-time notification:new events
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const handleNew = (payload: { title: string; message: string }) => {
      const newNotif: Notification = {
        id: `temp-${Date.now()}`,
        title: payload.title,
        message: payload.message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Re-fetch to get the real DB id (replace the temp one)
      api
        .get<Notification[]>('/notifications')
        .then((res) => setNotifications(res.data))
        .catch(() => {});
    };

    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/read-all');
    } catch {
      // silently ignore — next page load will re-sync
    }
  }, []);

  const addNotification = useCallback(
    (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
      setNotifications((prev) => [
        {
          id: `local-${Date.now()}`,
          ...n,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markRead, markAllRead, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
