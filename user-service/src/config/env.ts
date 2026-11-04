import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://admin:password123@localhost:5432/userdb'),
  JWT_SECRET: z.string().default('dev_secret'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables in user-service:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
