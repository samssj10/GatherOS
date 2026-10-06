import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/logger', () => ({ logger: { info: vi.fn() } }));

import { logger } from '../utils/logger';
import { MAX_LOGGED_HEADER_LENGTH, createRequestLogger } from './requestLogger';

function run(request: Partial<Request>, options?: Parameters<typeof createRequestLogger>[0]) {
  const res = Object.assign(new EventEmitter(), { statusCode: 200 }) as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  createRequestLogger(options)(request as Request, res, next);
  res.emit('finish');
  return next;
}

const proxied: Partial<Request> = {
  method: 'GET',
  path: '/health',
  ip: '172.70.1.2',
  headers: { 'x-forwarded-for': '203.0.113.10, 49.36.0.9, 172.70.1.2', 'cf-connecting-ip': '49.36.0.9' },
};

const loggedFields = () => vi.mocked(logger.info).mock.calls[0][0] as Record<string, unknown>;

beforeEach(() => {
  vi.mocked(logger.info).mockClear();
});

describe('requestLogger', () => {
  it('passes the request on', () => {
    expect(run({ method: 'GET', path: '/health', headers: {} })).toHaveBeenCalled();
  });

  it('logs the request, and no visitor address, unless asked to', () => {
    run(proxied);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/health', status: 200 }),
      'request completed',
    );
    const fields = loggedFields();
    expect(fields).not.toHaveProperty('ip');
    expect(fields).not.toHaveProperty('forwardedFor');
    expect(fields).not.toHaveProperty('cfConnectingIp');
  });

  it('with logClientAddress, logs where the visitor appears to come from', () => {
    run(proxied, { logClientAddress: true });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '172.70.1.2',
        forwardedFor: '203.0.113.10, 49.36.0.9, 172.70.1.2',
        cfConnectingIp: '49.36.0.9',
      }),
      'request completed',
    );
  });

  it('with logClientAddress, leaves out forwarding headers that were not sent', () => {
    run({ method: 'GET', path: '/health', ip: '127.0.0.1', headers: {} }, { logClientAddress: true });
    const fields = loggedFields();
    expect(fields.ip).toBe('127.0.0.1');
    expect(fields.forwardedFor).toBeUndefined();
    expect(fields.cfConnectingIp).toBeUndefined();
  });

  it('cuts a very long forwarding header short so it cannot flood the logs', () => {
    run(
      { method: 'GET', path: '/health', ip: '127.0.0.1', headers: { 'x-forwarded-for': '1.2.3.4, '.repeat(500) } },
      { logClientAddress: true },
    );
    const forwardedFor = loggedFields().forwardedFor as string;
    expect(forwardedFor.length).toBe(MAX_LOGGED_HEADER_LENGTH + 1);
    expect(forwardedFor.endsWith('…')).toBe(true);
  });
});
