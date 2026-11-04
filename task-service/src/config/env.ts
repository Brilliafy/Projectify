import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  MONGO_URI: z.string().default('mongodb://localhost:27017/taskdb'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string().default('dev_secret'),
  PORT: z.coerce.number().default(3003),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  STORAGE_DRIVER: z.enum(['gcs', 'local']).default('local'),
  GCS_BUCKET_NAME: z.string().default('projectify-attachments-storage'),
  GCP_PROJECT_ID: z.string().default('projectify-483418'),
  GCS_KEY_FILE: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables in task-service:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
