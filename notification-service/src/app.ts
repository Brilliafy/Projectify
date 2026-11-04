import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './config/env';
import { notificationRoutes } from './routes/notification.routes';

export function buildApp(): FastifyInstance {
  const server = Fastify({
    logger: env.NODE_ENV !== 'production' ? { level: 'info' } : false,
  });

  server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  server.register(jwt, {
    secret: env.JWT_SECRET,
  });

  server.get('/health', async () => ({ status: 'ok', service: 'notification-service' }));

  server.register(notificationRoutes);

  return server;
}
