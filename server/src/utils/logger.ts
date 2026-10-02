import pino from 'pino';
import { env } from './env';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Scrub PII from anything that ends up in a log line.
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      '*.email',
      '*.fullName',
      '*.name',
      '*.password',
    ],
    censor: '[REDACTED]',
  },
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});
