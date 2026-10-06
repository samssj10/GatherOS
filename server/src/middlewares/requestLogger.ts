import type { RequestHandler } from 'express';
import { logger } from '../utils/logger';

/** A client can send an enormous forwarding header; keep only the start of it in a log line. */
export const MAX_LOGGED_HEADER_LENGTH = 300;

const clip = (value: string | string[] | undefined): string | undefined => {
  if (value === undefined) return undefined;
  const text = Array.isArray(value) ? value.join(', ') : value;
  return text.length > MAX_LOGGED_HEADER_LENGTH ? `${text.slice(0, MAX_LOGGED_HEADER_LENGTH)}…` : text;
};

export interface RequestLoggerOptions {
  /**
   * Also log where each request appears to come from: the address Express settled on (which depends on
   * TRUST_PROXY_HOPS), the raw X-Forwarded-For chain and Cloudflare's CF-Connecting-IP. Visitor
   * addresses are personal data, so this is off unless you are working out the right TRUST_PROXY_HOPS.
   */
  logClientAddress?: boolean;
}

export function createRequestLogger({ logClientAddress = false }: RequestLoggerOptions = {}): RequestHandler {
  return (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      // Pino's redact config scrubs PII fields (email, names) from the body.
      logger.info(
        {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Math.round(durationMs),
          ...(logClientAddress && {
            ip: req.ip,
            forwardedFor: clip(req.headers['x-forwarded-for']),
            cfConnectingIp: clip(req.headers['cf-connecting-ip']),
          }),
          body: req.body as unknown,
        },
        'request completed',
      );
    });

    next();
  };
}
