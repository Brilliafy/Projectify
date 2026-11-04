import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  lazyConnect: true,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

redis.on('error', (err) => {
  console.warn('Task Service Redis warning:', err.message);
});

export interface TaskNotificationPayload {
  userIds: number[];
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'COMMENT_ADDED';
  message: string;
  relatedId: string;
  metadata?: Record<string, unknown>;
}

export async function publishTaskNotification(payload: TaskNotificationPayload): Promise<void> {
  try {
    await redis.publish('notifications', JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to publish task notification to Redis:', err);
  }
}
