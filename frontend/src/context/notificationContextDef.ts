import { createContext } from 'react';
import type { Notification } from '../types';

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
