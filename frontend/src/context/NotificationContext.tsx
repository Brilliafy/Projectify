import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { notificationApi } from '../api/notificationApi';
import { demoNotificationBus } from '../demo/mockBackend';
import toast from 'react-hot-toast';
import type { Notification } from '../types';
import { NotificationContext } from './notificationContextDef';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch initial notification history asynchronously
  useEffect(() => {
    let isMounted = true;
    if (user && token) {
      notificationApi
        .get('')
        .then(({ data }) => {
          if (isMounted && Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch notifications', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user, token]);

  // Connect Socket for real-time notifications
  useEffect(() => {
    if (!user || !token) return;

    // Listen to offline demo notifications
    const handleDemoNotif = (e: Event) => {
      const notif = (e as CustomEvent<Notification>).detail;
      if (!user || notif.userId === user.id) {
        setNotifications((prev) => [notif, ...prev]);
        toast(notif.message, {
          icon: '🔔',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    };
    demoNotificationBus.addEventListener('notification', handleDemoNotif);

    // If socket server is available, connect, otherwise gracefully fallback
    let newSocket: ReturnType<typeof io> | null = null;
    try {
      newSocket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 2000,
        reconnectionAttempts: 1,
      });

      newSocket.on('notification', (notif: Notification) => {
        setNotifications((prev) => [notif, ...prev]);
        toast(notif.message, {
          icon: '🔔',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      });
    } catch {
      // offline mode
    }

    return () => {
      demoNotificationBus.removeEventListener('notification', handleDemoNotif);
      newSocket?.disconnect();
    };
  }, [user, token]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.patch(`/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.patch('/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotifications = async () => {
    try {
      await notificationApi.delete('');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
