import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { taskRoutes } from './routes/task.routes';
import { commentRoutes } from './routes/comment.routes';

export function buildApp(): FastifyInstance {
  const server = Fastify({
    logger: env.NODE_ENV !== 'production' ? { level: 'info' } : false,
  });

  server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  server.register(jwt, {
    secret: env.JWT_SECRET,
  });

  server.register(multipart, {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
      files: 5,
    },
  });

  server.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'You have exceeded the request limit. Please try again later.',
    }),
  });

  server.get('/health', async () => ({ status: 'ok', service: 'task-service' }));

  server.register(taskRoutes);
  server.register(commentRoutes);

  return server;
}
