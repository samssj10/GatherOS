import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '../types';
import { AppError } from './AppError';
import { reflowDay } from './reflow';
import { applyTiming } from './restoreTiming';
import { restoreTimingBodySchema } from './scheduleSchema';

const item = (id: string, day: number, startTime: string, endTime: string): ScheduleItem => ({
  id,
  day,
  startTime,
  endTime,
  title: `Title ${id}`,
  description: `About ${id}`,
  location: 'Hall',
  category: 'workshop',
  costEstimate: 100,
});

// Day 1: a, then a lunch-sized gap, then b. Day 4: c, then a gap, then d.
const original = [
  item('a', 1, '09:00', '10:00'),
  item('b', 1, '12:00', '13:00'),
  item('c', 4, '09:00', '10:00'),
  item('d', 4, '14:00', '16:00'),
];

describe('applyTiming', () => {
  it('changes only the day and times of the listed sessions', () => {
    const result = applyTiming(original, [{ id: 'a', day: 4, startTime: '11:00', endTime: '12:00' }]);
    expect(result[0]).toEqual({ ...original[0], day: 4, startTime: '11:00', endTime: '12:00' });
    expect(result.slice(1)).toEqual(original.slice(1));
  });

  it('keeps the order of the schedule', () => {
    const result = applyTiming(original, [{ id: 'd', day: 1, startTime: '17:00', endTime: '19:00' }]);
    expect(result.map((entry) => entry.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('rejects a session that no longer exists', () => {
    expect(() => applyTiming(original, [{ id: 'gone', day: 1, startTime: '09:00', endTime: '10:00' }])).toThrow(
      AppError,
    );
  });

  it('undoes a move exactly, which moving the session back cannot', () => {
    const moved = reflowDay(original, 4, ['c', 'd', 'a']);
    // Moving "a" back by reordering day 1 does not bring day 4's gap back...
    const movedBack = reflowDay(moved, 1, ['a', 'b']);
    expect(movedBack).not.toEqual(original);
    // ...but putting the saved timings back does.
    const entries = original.map(({ id, day, startTime, endTime }) => ({ id, day, startTime, endTime }));
    expect(applyTiming(moved, entries)).toEqual(original);
  });
});

describe('restoreTimingBodySchema', () => {
  const entry = { id: 'a', day: 2, startTime: '09:00', endTime: '10:00' };

  it('accepts a list of timings', () => {
    expect(restoreTimingBodySchema.safeParse({ items: [entry, { ...entry, id: 'b' }] }).success).toBe(true);
  });

  it('rejects an empty list, duplicates, bad days and times, and extra fields', () => {
    expect(restoreTimingBodySchema.safeParse({ items: [] }).success).toBe(false);
    expect(restoreTimingBodySchema.safeParse({ items: [entry, entry] }).success).toBe(false);
    expect(restoreTimingBodySchema.safeParse({ items: [{ ...entry, day: 8 }] }).success).toBe(false);
    expect(restoreTimingBodySchema.safeParse({ items: [{ ...entry, startTime: '9:00' }] }).success).toBe(false);
    expect(restoreTimingBodySchema.safeParse({ items: [{ ...entry, startTime: '11:00' }] }).success).toBe(false);
    expect(restoreTimingBodySchema.safeParse({ items: [{ ...entry, title: 'sneaky' }] }).success).toBe(false);
    expect(restoreTimingBodySchema.safeParse({ items: [entry], extra: 1 }).success).toBe(false);
  });
});
