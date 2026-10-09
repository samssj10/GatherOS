import type { AttendeeScheduleDTO } from '@/types';
import { sortSessions } from '@/utils/gamification';

export const CODE_LENGTH = 6;
const PAYLOAD_PATTERN = /^gatheros:([\w-]{1,60}):([A-Za-z0-9]{6})$/i;
const BARE_CODE_PATTERN = /^[A-Za-z0-9]{6}$/;

/** What a person typed, shaped like a room code: upper case, letters and digits only, at most 6. */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH);
}

export function isCompleteCode(input: string): boolean {
  return normalizeCode(input).length === CODE_LENGTH;
}

/** The text encoded in the room screen's QR code. */
export function buildCheckInPayload(sessionId: string, code: string): string {
  return `gatheros:${sessionId}:${code}`;
}

export interface CheckInPayload {
  /** Null for a bare code, which relies on the session the attendee is checking in to. */
  sessionId: string | null;
  code: string;
}

/** Reads a scanned QR value: the full payload, or just the 6-character code. Anything else is null. */
export function parseCheckInPayload(text: string): CheckInPayload | null {
  const value = text.trim();
  const full = PAYLOAD_PATTERN.exec(value);
  if (full) return { sessionId: full[1], code: full[2].toUpperCase() };
  if (BARE_CODE_PATTERN.test(value)) return { sessionId: null, code: value.toUpperCase() };
  return null;
}

/** Sessions whose check-in is open right now, in the order they happen. */
export function liveSessions(sessions: AttendeeScheduleDTO[]): AttendeeScheduleDTO[] {
  return sortSessions(sessions).filter((session) => session.checkInStatus === 'live');
}

/** The next session that has not started yet, if any. */
export function nextSession(sessions: AttendeeScheduleDTO[]): AttendeeScheduleDTO | undefined {
  return sortSessions(sessions).find((session) => session.checkInStatus === 'upcoming');
}

/**
 * The day an attendee most likely wants to look at: the day of the session that is live right now,
 * otherwise the day of the next one. Undefined once the trip is over.
 */
export function focusDay(sessions: AttendeeScheduleDTO[]): number | undefined {
  return (liveSessions(sessions)[0] ?? nextSession(sessions))?.day;
}

/**
 * Whole seconds until the code changes. `elapsedMs` is how long ago the response arrived, so the
 * countdown follows the server's clock even when that clock is pinned for a demo.
 */
export function secondsRemaining(info: { expiresAt: string; serverTime: string }, elapsedMs: number): number {
  const left = Date.parse(info.expiresAt) - Date.parse(info.serverTime) - elapsedMs;
  return Math.max(0, Math.ceil(left / 1000));
}

/** 42 seconds as "0:42"; 75 as "1:15". */
export function formatCountdown(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** The made-up "checked in" figure on the sample room screens: 996, but never more than the people going. */
export const SAMPLE_CHECKED_IN = 996;

export function sampleCheckedIn(going: number): { count: number; percent: number } {
  const count = Math.min(SAMPLE_CHECKED_IN, Math.max(0, going));
  return { count, percent: going > 0 ? Math.round((count / going) * 100) : 0 };
}
