import mongoose from 'mongoose';
import { buildApp } from './app';
import { env } from './config/env';
import { redis } from './services/notification.publisher';

const server = buildApp();

async function start() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Task Service connected to MongoDB');

    try {
      await redis.connect();
      console.log('Task Service connected to Redis');
    } catch (redisErr) {
      console.warn('Task Service Redis initial connect warning:', redisErr);
    }

    await server.listen({ port: env.PORT, host: env.HOST });
    console.log(`Task Service running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    console.error('Failed to start Task Service:', err);
    await mongoose.disconnect();
    redis.disconnect();
    process.exit(1);
  }
}

const shutdown = async () => {
  console.log('Shutting down Task Service...');
  await server.close();
  await mongoose.disconnect();
  redis.disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();