import Fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';

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

  server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'You have exceeded the request rate limit. Please try again later.',
    }),
  });

  // Health check route
  server.get('/health', async () => ({ status: 'ok', service: 'user-service' }));

  // Register feature routes
  server.register(authRoutes);
  server.register(userRoutes);

  return server;
}
