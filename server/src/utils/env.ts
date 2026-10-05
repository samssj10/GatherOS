import 'dotenv/config';
import { z } from 'zod';
import { todayAsEventDate } from './eventClock';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  STAMP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  // Hosting: serve the built React app from this server, and how many proxies sit in front of it.
  SERVE_CLIENT: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(8),
  PLANNER_EMAIL: z.string().email().default('planner@gatheros.example.com'),
  // Check-in opens and closes by the clock. Day 1 is EVENT_START_DATE (default: today); EVENT_NOW pins "now" for demos and tests.
  EVENT_START_DATE: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'EVENT_START_DATE must look like 2030-06-03')
    .default(todayAsEventDate()),
  EVENT_NOW: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'EVENT_NOW must be a date-time like 2030-06-03T09:30:00')
    .optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5'),
});

// Treat `KEY=` (empty) lines copied from .env.example as unset so defaults and optionals apply.
const rawEnv = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  // The logger depends on env, so fail fast on stderr.
  console.error('Invalid environment configuration:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
