import type { RequestHandler } from 'express';
import { logger } from '../utils/logger';

export const requestLogger: RequestHandler = (req, res, next) => {
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
        // Where the visitor appears to come from, as seen at each step: the address Express settled on
        // (which depends on TRUST_PROXY_HOPS), the raw forwarding chain, and Cloudflare's single-address
        // header when a host sends it. Reading a few of these lines shows the right TRUST_PROXY_HOPS.
        ip: req.ip,
        forwardedFor: req.headers['x-forwarded-for'],
        cfConnectingIp: req.headers['cf-connecting-ip'],
        body: req.body as unknown,
      },
      'request completed',
    );
  });

  next();
};
