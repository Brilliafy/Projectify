import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api/notificationApi';
import toast from 'react-hot-toast';

export interface Notification {
  _id: string;
  userId: number;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'COMMENT_ADDED' | 'TEAM_ADDED';
  message: string;
  relatedId: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch initial history
  const fetchNotifications = async () => {
    try {
      const { data } = await notificationApi.get('');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Connect Socket
  useEffect(() => {
    if (user && token) {
      // Connect to the notification service
      // Using /socket.io path which Nginx handles or direct port in dev
      const socketUrl = '/'; 
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'] 
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

      fetchNotifications();

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.patch(`/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
     try {
       await notificationApi.patch('/read-all');
       setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
