import { createHmac, timingSafeEqual } from 'node:crypto';

/** 32 symbols, so a byte maps onto it without bias. No 0/O or 1/I: the code is read off a screen. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;
/** The code changes every minute. */
export const CODE_PERIOD_MS = 60_000;
/** How many past minutes are told apart as "expired" rather than "wrong". */
const EXPIRED_LOOKBACK = 10;

export type CodeCheck = 'valid' | 'expired' | 'invalid';

export function codePeriod(now: Date): number {
  return Math.floor(now.getTime() / CODE_PERIOD_MS);
}

/** The room code for one session in one minute. Derived from the secret, so nothing is stored. */
export function codeForPeriod(secret: string, sessionId: string, period: number): string {
  const digest = createHmac('sha256', secret).update(`checkin:${sessionId}:${period}`).digest();
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[digest[i] % CODE_ALPHABET.length];
  return code;
}

export interface RoomCode {
  code: string;
  /** When the code changes: the end of the current minute. */
  expiresAt: Date;
}

export function currentRoomCode(secret: string, sessionId: string, now: Date): RoomCode {
  const period = codePeriod(now);
  return {
    code: codeForPeriod(secret, sessionId, period),
    expiresAt: new Date((period + 1) * CODE_PERIOD_MS),
  };
}

function sameCode(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Checks a submitted code. The current minute's code and the previous one both count, so a scan that
 * straddles the change still works. Older codes are reported as expired; anything else is wrong.
 *
 * `oneMinuteAgo` is the event clock as it read a real minute ago. It is normally the previous minute
 * anyway, but when the clock is looped (showcase mode) it also covers the jump back to the start of
 * the loop, so a code read just before the jump is still good just after it.
 */
export function verifyRoomCode(
  secret: string,
  sessionId: string,
  submitted: string,
  now: Date,
  oneMinuteAgo?: Date,
): CodeCheck {
  const attempt = submitted.trim().toUpperCase();
  const period = codePeriod(now);
  const valid = new Set([period, period - 1]);
  if (oneMinuteAgo) valid.add(codePeriod(oneMinuteAgo));

  for (const candidate of valid) {
    if (sameCode(attempt, codeForPeriod(secret, sessionId, candidate))) return 'valid';
  }
  for (let back = 2; back <= EXPIRED_LOOKBACK; back += 1) {
    if (valid.has(period - back)) continue;
    if (sameCode(attempt, codeForPeriod(secret, sessionId, period - back))) return 'expired';
  }
  return 'invalid';
}
