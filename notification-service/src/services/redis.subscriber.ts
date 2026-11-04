import Redis from 'ioredis';
import { env } from '../config/env';
import { Notification, NotificationType } from '../models/notification.model';
import { socketManager } from './socket.manager';

export const redisSub = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  lazyConnect: true,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

interface InboundNotificationEvent {
  userIds: number[];
  type: NotificationType;
  message: string;
  relatedId?: string;
  metadata?: Record<string, unknown>;
}

export async function initRedisSubscriber(): Promise<void> {
  try {
    await redisSub.connect();
    console.log('Notification Service connected to Redis Subscriber');

    await redisSub.subscribe('notifications');
    console.log('Subscribed to "notifications" channel');

    redisSub.on('message', async (channel: string, message: string) => {
      if (channel !== 'notifications') return;

      try {
        const data: InboundNotificationEvent = JSON.parse(message);
        if (!Array.isArray(data.userIds) || data.userIds.length === 0) return;

        const docsToInsert = data.userIds.map((uid) => ({
          userId: uid,
          type: data.type,
          message: data.message,
          relatedId: data.relatedId,
          metadata: data.metadata,
          read: false,
        }));

        const created = await Notification.insertMany(docsToInsert);

        for (const notif of created) {
          socketManager.emitToUser(notif.userId, 'notification', notif);
        }
      } catch (err) {
        console.error('Error processing notification Redis message:', err);
      }
    });
  } catch (err) {
    console.warn('Redis subscriber connection warning:', err);
  }
}
