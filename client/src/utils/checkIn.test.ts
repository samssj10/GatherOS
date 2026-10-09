import { describe, expect, it } from 'vitest';
import type { AttendeeScheduleDTO } from '@/types';
import {
  buildCheckInPayload,
  focusDay,
  formatCountdown,
  isCompleteCode,
  liveSessions,
  nextSession,
  normalizeCode,
  parseCheckInPayload,
  sampleCheckedIn,
  secondsRemaining,
} from './checkIn';

const session = (
  id: string,
  day: number,
  startTime: string,
  checkInStatus: AttendeeScheduleDTO['checkInStatus'],
): AttendeeScheduleDTO => ({
  id,
  eventId: 'evt',
  day,
  sessionTitle: id,
  startTime,
  endTime: '23:00',
  locationName: 'Hall',
  category: 'workshop',
  isRsvpRequired: false,
  checkInStatus,
});

describe('normalizeCode', () => {
  it('upper-cases and keeps letters and digits only', () => {
    expect(normalizeCode('k7q2xm')).toBe('K7Q2XM');
    expect(normalizeCode(' k7q-2 xm ')).toBe('K7Q2XM');
  });

  it('stops at six characters', () => {
    expect(normalizeCode('K7Q2XMZZ')).toBe('K7Q2XM');
  });

  it('knows when a code is complete', () => {
    expect(isCompleteCode('K7Q2X')).toBe(false);
    expect(isCompleteCode('k7q2xm')).toBe(true);
  });
});

describe('check-in payload', () => {
  it('round-trips a built payload', () => {
    const payload = buildCheckInPayload('sch-001', 'K7Q2XM');
    expect(payload).toBe('gatheros:sch-001:K7Q2XM');
    expect(parseCheckInPayload(payload)).toEqual({ sessionId: 'sch-001', code: 'K7Q2XM' });
  });

  it('accepts a bare code with no session', () => {
    expect(parseCheckInPayload(' k7q2xm ')).toEqual({ sessionId: null, code: 'K7Q2XM' });
  });

  it('upper-cases the code in a full payload', () => {
    expect(parseCheckInPayload('GatherOS:ai-004:abcd23')).toEqual({ sessionId: 'ai-004', code: 'ABCD23' });
  });

  it('rejects anything else a camera might read', () => {
    for (const text of ['', 'hello world', 'https://example.com', 'gatheros:sch-001', 'K7Q2X', 'K7Q2XMZ']) {
      expect(parseCheckInPayload(text)).toBeNull();
    }
  });
});

describe('liveSessions and nextSession', () => {
  const sessions = [
    session('c', 1, '12:15', 'upcoming'),
    session('a', 1, '09:00', 'ended'),
    session('b', 1, '10:15', 'live'),
    session('d', 2, '09:30', 'upcoming'),
  ];

  it('lists only live sessions', () => {
    expect(liveSessions(sessions).map((s) => s.id)).toEqual(['b']);
  });

  it('finds the next upcoming session in trip order', () => {
    expect(nextSession(sessions)?.id).toBe('c');
  });

  it('returns nothing when nothing is live or upcoming', () => {
    const done = [session('a', 1, '09:00', 'ended')];
    expect(liveSessions(done)).toEqual([]);
    expect(nextSession(done)).toBeUndefined();
  });
});

describe('focusDay', () => {
  it('is the day of the live session', () => {
    const sessions = [
      session('a', 1, '09:00', 'ended'),
      session('b', 4, '10:15', 'live'),
      session('c', 4, '12:00', 'upcoming'),
    ];
    expect(focusDay(sessions)).toBe(4);
  });

  it('is the day of the next session when nothing is live', () => {
    const sessions = [session('a', 1, '09:00', 'ended'), session('b', 2, '09:30', 'upcoming'), session('c', 5, '09:00', 'upcoming')];
    expect(focusDay(sessions)).toBe(2);
  });

  it('prefers a live session over an earlier upcoming one', () => {
    const sessions = [session('a', 2, '09:00', 'upcoming'), session('b', 3, '10:00', 'live')];
    expect(focusDay(sessions)).toBe(3);
  });

  it('is undefined once every session has ended', () => {
    expect(focusDay([session('a', 1, '09:00', 'ended')])).toBeUndefined();
  });
});

describe('countdown', () => {
  const info = { expiresAt: '2030-06-03T09:31:00.000Z', serverTime: '2030-06-03T09:30:18.000Z' };

  it('counts down from the server time, not the browser clock', () => {
    expect(secondsRemaining(info, 0)).toBe(42);
    expect(secondsRemaining(info, 10_000)).toBe(32);
  });

  it('rounds partial seconds up and never goes negative', () => {
    expect(secondsRemaining(info, 41_500)).toBe(1);
    expect(secondsRemaining(info, 60_000)).toBe(0);
  });

  it('formats seconds as m:ss', () => {
    expect(formatCountdown(42)).toBe('0:42');
    expect(formatCountdown(75)).toBe('1:15');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('sampleCheckedIn', () => {
  it('is 996 of the people going, and fills the bar to match', () => {
    expect(sampleCheckedIn(1235)).toEqual({ count: 996, percent: 81 });
  });

  it('never claims more people than are going', () => {
    expect(sampleCheckedIn(500)).toEqual({ count: 500, percent: 100 });
    expect(sampleCheckedIn(0)).toEqual({ count: 0, percent: 0 });
  });
});
