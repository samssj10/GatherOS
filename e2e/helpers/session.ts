import { createHmac } from 'node:crypto';
import type { Cookie } from '@playwright/test';
import { SESSION_SECRET } from './env';

export interface E2ESession {
  id: string;
  name: string;
  email: string;
  role: 'planner' | 'attendee';
  eventId: string;
}

export const SESSION_COOKIE_NAME = 'gatheros_session';

export const plannerSession: E2ESession = {
  id: 'planner-001',
  name: 'Event Planner',
  email: 'planner@gatheros.example.com',
  role: 'planner',
  eventId: 'evt-offsite-2026',
};

// att-0001 is the first attendee of the deterministic mock database.
export const attendeeSession: E2ESession = {
  id: 'att-0001',
  name: 'Amara Silva',
  email: 'amara.silva.0001@example.com',
  role: 'attendee',
  eventId: 'evt-offsite-2026',
};

// att-0002 and att-0003 both accepted their RSVP in the seeded data.
export const secondAttendee: E2ESession = {
  id: 'att-0002',
  name: 'Olivia Walker',
  email: 'olivia.walker.0002@example.com',
  role: 'attendee',
  eventId: 'evt-offsite-2026',
};

export const thirdAttendee: E2ESession = {
  id: 'att-0003',
  name: 'Mei Kim',
  email: 'mei.kim.0003@example.com',
  role: 'attendee',
  eventId: 'evt-offsite-2026',
};

/**
 * Signs a session exactly the way server/src/services/sessionService.ts does:
 * base64url(JSON payload) + "." + base64url(HMAC-SHA256). If that format ever changes,
 * the suite fails loudly because the BFF answers 401 and the app redirects to /login.
 */
function signSession(session: E2ESession, ttlMs = 60 * 60 * 1000): string {
  const payload = Buffer.from(JSON.stringify({ session, exp: Date.now() + ttlMs })).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/** The same cookie the login endpoint would set: HttpOnly, SameSite=Strict. */
export function sessionCookie(session: E2ESession): Cookie {
  return {
    name: SESSION_COOKIE_NAME,
    value: signSession(session),
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
    expires: Math.floor(Date.now() / 1000) + 60 * 60,
  };
}
