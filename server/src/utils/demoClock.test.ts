import { describe, expect, it } from 'vitest';
import { CODE_PERIOD_MS, codePeriod, currentRoomCode, verifyRoomCode } from './checkInCode';
import { firstSessionWindow, loopedTime } from './demoClock';
import { parseEventDate } from './eventClock';

const MINUTE = 60_000;
const at = (hours: number, minutes: number, seconds = 0) => new Date(2030, 5, 3, hours, minutes, seconds);
const KEYNOTE = { start: at(9, 0), end: at(10, 0) };
// An arbitrary real moment, far from any special value.
const REAL = 1_900_000_000_000;

describe('loopedTime', () => {
  it('always lands inside the window, whatever the real time is', () => {
    for (const lengthMinutes of [15, 45, 60, 75, 90]) {
      const end = new Date(KEYNOTE.start.getTime() + lengthMinutes * MINUTE);
      // Every 7 minutes and 13 seconds for two days, so the loop's edges are crossed at odd offsets.
      for (let t = 0; t < 48 * 60 * MINUTE; t += 7 * MINUTE + 13_000) {
        const result = loopedTime(new Date(REAL + t), KEYNOTE.start, end);
        expect(result.getTime()).toBeGreaterThanOrEqual(KEYNOTE.start.getTime());
        expect(result.getTime()).toBeLessThan(end.getTime());
      }
    }
  });

  it('moves forward one second for every real second', () => {
    const before = loopedTime(new Date(REAL), KEYNOTE.start, KEYNOTE.end);
    const after = loopedTime(new Date(REAL + 20_000), KEYNOTE.start, KEYNOTE.end);
    // Unless the 20 seconds happen to cross the jump, in which case it is 20 seconds minus one loop.
    const step = (after.getTime() - before.getTime() + 60 * MINUTE) % (60 * MINUTE);
    expect(step).toBe(20_000);
  });

  it('jumps back to the start when it reaches the end', () => {
    const length = KEYNOTE.end.getTime() - KEYNOTE.start.getTime();
    const wrap = Math.ceil(REAL / length) * length;
    expect(loopedTime(new Date(wrap), KEYNOTE.start, KEYNOTE.end).getTime()).toBe(KEYNOTE.start.getTime());
    expect(loopedTime(new Date(wrap - 1), KEYNOTE.start, KEYNOTE.end).getTime()).toBe(KEYNOTE.end.getTime() - 1);
  });

  it('keeps its minutes in step with real minutes, so the room code changes when a real minute passes', () => {
    const onTheMinute = Math.ceil(REAL / MINUTE) * MINUTE;
    expect(loopedTime(new Date(onTheMinute), KEYNOTE.start, KEYNOTE.end).getTime() % MINUTE).toBe(0);
    expect(loopedTime(new Date(onTheMinute - 1), KEYNOTE.start, KEYNOTE.end).getTime() % MINUTE).toBe(MINUTE - 1);
  });

  it('gives back the real time for an empty window', () => {
    const real = at(14, 5);
    expect(loopedTime(real, KEYNOTE.start, KEYNOTE.start)).toBe(real);
  });
});

describe('firstSessionWindow', () => {
  const eventStart = parseEventDate('2030-06-03');
  const schedule = [
    { day: 2, startTime: '08:00', endTime: '09:00' },
    { day: 1, startTime: '10:15', endTime: '12:00' },
    { day: 1, startTime: '09:00', endTime: '10:00' },
  ];

  it('is the earliest session on Day 1', () => {
    const window = firstSessionWindow(schedule, eventStart);
    expect(window?.start.getTime()).toBe(at(9, 0).getTime());
    expect(window?.end.getTime()).toBe(at(10, 0).getTime());
  });

  it('is null when Day 1 has no sessions', () => {
    expect(firstSessionWindow([{ day: 2, startTime: '09:00', endTime: '10:00' }], eventStart)).toBeNull();
    expect(firstSessionWindow([], eventStart)).toBeNull();
  });
});

describe('a room code read just before the loop jumps back', () => {
  const secret = 'a-test-secret-that-is-at-least-32-characters';
  const length = KEYNOTE.end.getTime() - KEYNOTE.start.getTime();
  const wrap = Math.ceil(REAL / length) * length;
  const clock = (real: number) => loopedTime(new Date(real), KEYNOTE.start, KEYNOTE.end);

  it('is still accepted just after the jump', () => {
    const before = clock(wrap - 20_000); // 09:59:40 on the loop
    const code = currentRoomCode(secret, 'sch-001', before).code;

    const after = clock(wrap + 10_000); // 09:00:10 on the loop: ten seconds after the jump
    expect(after.getTime()).toBeLessThan(before.getTime());

    // Counting minutes on the loop alone, the old code is gone...
    expect(verifyRoomCode(secret, 'sch-001', code, after)).not.toBe('valid');
    // ...but the clock as it read a real minute ago still has it.
    const aMinuteAgo = clock(wrap + 10_000 - CODE_PERIOD_MS);
    expect(verifyRoomCode(secret, 'sch-001', code, after, aMinuteAgo)).toBe('valid');
  });

  it('stops being accepted once a real minute and a bit has passed', () => {
    const code = currentRoomCode(secret, 'sch-001', clock(wrap - 20_000)).code;
    const later = wrap + 2 * MINUTE + 5_000;
    expect(verifyRoomCode(secret, 'sch-001', code, clock(later), clock(later - CODE_PERIOD_MS))).not.toBe('valid');
  });

  it('changes nothing away from the jump: the minute ago is just the previous minute', () => {
    const real = wrap + 30 * MINUTE + 5_000;
    const now = clock(real);
    const ago = clock(real - CODE_PERIOD_MS);
    expect(codePeriod(ago)).toBe(codePeriod(now) - 1);
    const previous = currentRoomCode(secret, 'sch-001', ago).code;
    expect(verifyRoomCode(secret, 'sch-001', previous, now, ago)).toBe('valid');
    expect(verifyRoomCode(secret, 'sch-001', previous, now)).toBe('valid');
  });
});
