import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { notificationApi } from '../api/notificationApi';
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

    const socketUrl = '/';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Notification Service');
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

    return () => {
      newSocket.disconnect();
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
