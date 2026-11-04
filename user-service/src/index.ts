import { buildApp } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

const server = buildApp();

async function start() {
  try {
    await server.listen({ port: env.PORT, host: env.HOST });
    console.log(`User Service running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    console.error('Failed to start User Service:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down User Service...');
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
