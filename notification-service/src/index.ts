import mongoose from 'mongoose';
import { buildApp } from './app';
import { env } from './config/env';
import { socketManager } from './services/socket.manager';
import { initRedisSubscriber, redisSub } from './services/redis.subscriber';

const server = buildApp();

async function start() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Notification Service connected to MongoDB');

    // Attach native socket.io to Fastify HTTP server
    socketManager.init(server);

    await server.listen({ port: env.PORT, host: env.HOST });
    console.log(`Notification Service running on http://${env.HOST}:${env.PORT}`);

    // Start listening on Redis Pub/Sub
    await initRedisSubscriber();
  } catch (err) {
    console.error('Failed to start Notification Service:', err);
    await mongoose.disconnect();
    redisSub.disconnect();
    process.exit(1);
  }
}

const shutdown = async () => {
  console.log('Shutting down Notification Service...');
  socketManager.close();
  await server.close();
  await mongoose.disconnect();
  redisSub.disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
