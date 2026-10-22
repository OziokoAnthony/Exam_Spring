import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Railway and most hosts inject PORT.
  API_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(Number(process.env.PORT ?? 3001)),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  // The browser reaches the API through the web app's /api proxy (next.config.mjs).
  REFRESH_COOKIE_PATH: z.string().startsWith('/').default('/api/v1/auth'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
