import 'dotenv/config';
import { z } from 'zod';

/**
 * Zod-validated process.env → a typed, frozen config object.
 * Fails fast at boot if a required var is missing/invalid (NFR: robustness).
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGO_MAX_POOL_SIZE: z.coerce.number().int().positive().default(8),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SLIDING: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // Seed guard (§12): fixed-password fixtures only under test; explicit override elsewhere.
  SEED_ALLOW: z
    .enum(['0', '1'])
    .default('0')
    .transform((v) => v === '1'),
});

export type AppConfig = z.infer<typeof EnvSchema> & { corsOrigins: string[] };

function load(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`Invalid environment configuration:\n${issues}`);
    throw new Error('Invalid environment configuration');
  }
  const corsOrigins = parsed.data.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return Object.freeze({ ...parsed.data, corsOrigins });
}

export const env = load();

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
