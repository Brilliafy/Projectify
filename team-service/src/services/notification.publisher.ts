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
  console.warn('Team Service Redis warning:', err.message);
});

export interface TeamNotificationPayload {
  userIds: number[];
  type: 'TEAM_ADDED';
  message: string;
  relatedId: string;
  metadata?: {
    teamName: string;
    leaderName: string;
  };
}

export async function publishTeamNotification(payload: TeamNotificationPayload): Promise<void> {
  try {
    await redis.publish('notifications', JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to publish team notification to Redis:', err);
  }
}
