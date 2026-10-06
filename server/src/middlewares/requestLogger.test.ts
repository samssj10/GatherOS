import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/logger', () => ({ logger: { info: vi.fn() } }));

import { logger } from '../utils/logger';
import { requestLogger } from './requestLogger';

function run(request: Partial<Request>) {
  const res = Object.assign(new EventEmitter(), { statusCode: 200 }) as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  requestLogger(request as Request, res, next);
  res.emit('finish');
  return next;
}

beforeEach(() => {
  vi.mocked(logger.info).mockClear();
});

describe('requestLogger', () => {
  it('passes the request on', () => {
    expect(run({ method: 'GET', path: '/health', headers: {} })).toHaveBeenCalled();
  });

  it('logs where the visitor appears to come from, so TRUST_PROXY_HOPS can be set from facts', () => {
    run({
      method: 'GET',
      path: '/health',
      ip: '172.70.1.2',
      headers: { 'x-forwarded-for': '203.0.113.10, 49.36.0.9, 172.70.1.2', 'cf-connecting-ip': '49.36.0.9' },
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/health',
        status: 200,
        ip: '172.70.1.2',
        forwardedFor: '203.0.113.10, 49.36.0.9, 172.70.1.2',
        cfConnectingIp: '49.36.0.9',
      }),
      'request completed',
    );
  });

  it('logs nothing extra for a request that arrived without any forwarding headers', () => {
    run({ method: 'GET', path: '/health', ip: '127.0.0.1', headers: {} });
    const [fields] = vi.mocked(logger.info).mock.calls[0] as [Record<string, unknown>, string];
    expect(fields.ip).toBe('127.0.0.1');
    expect(fields.forwardedFor).toBeUndefined();
    expect(fields.cfConnectingIp).toBeUndefined();
  });
});
