import { createHmac, timingSafeEqual } from 'node:crypto';
import type { UserSession } from '../types';
import { env } from '../utils/env';

export const SESSION_COOKIE_NAME = 'gatheros_session';

interface SessionPayload {
  session: UserSession;
  exp: number; // epoch ms
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(encodedPayload).digest('base64url');
}

/** Creates a tamper-proof token: base64url(payload).base64url(hmac-sha256). */
export function createSessionToken(session: UserSession): string {
  const payload: SessionPayload = {
    session,
    exp: Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

/** Returns the session if the token is authentic and unexpired, otherwise null. */
export function verifySessionToken(token: string): UserSession | null {
  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload.session;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
};
