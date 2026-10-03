import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '../types';
import { AppError } from './AppError';
import { reflowDay } from './reflow';

const item = (id: string, day: number, startTime: string, endTime: string): ScheduleItem => ({
  id,
  day,
  startTime,
  endTime,
  title: id,
  description: '',
  location: '',
  category: 'workshop',
  costEstimate: 0,
});

const base = [
  item('keynote', 1, '09:00', '10:00'),
  item('workshop', 1, '10:15', '12:00'),
  item('lunch', 1, '12:15', '13:30'),
  item('sprint', 2, '09:30', '11:30'),
  item('sailing', 2, '14:00', '17:00'),
];

const times = (items: ScheduleItem[], day: number) =>
  items
    .filter((entry) => entry.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((entry) => `${entry.id} ${entry.startTime}-${entry.endTime}`);

describe('reflowDay (server)', () => {
  it('re-times a reordered day back to back, 15 minutes apart, keeping each duration', () => {
    expect(times(reflowDay(base, 1, ['lunch', 'keynote', 'workshop']), 1)).toEqual([
      'lunch 09:00-10:15',
      'keynote 10:30-11:30',
      'workshop 11:45-13:30',
    ]);
  });

  it('moves a session onto another day and re-times only that day', () => {
    const result = reflowDay(base, 2, ['keynote', 'sprint', 'sailing']);
    expect(times(result, 2)).toEqual(['keynote 09:30-10:30', 'sprint 10:45-12:45', 'sailing 13:00-16:00']);
    expect(times(result, 1)).toEqual(['workshop 10:15-12:00', 'lunch 12:15-13:30']);
  });

  it('keeps the moved session\'s own start time on an empty day', () => {
    expect(times(reflowDay(base, 3, ['lunch']), 3)).toEqual(['lunch 12:15-13:30']);
  });

  it('does not mutate its input', () => {
    const snapshot = JSON.stringify(base);
    reflowDay(base, 1, ['lunch', 'keynote', 'workshop']);
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it('rejects duplicate ids', () => {
    expect(() => reflowDay(base, 1, ['keynote', 'keynote', 'workshop', 'lunch'])).toThrow(AppError);
  });

  it('rejects unknown ids', () => {
    expect(() => reflowDay(base, 1, ['ghost', 'keynote', 'workshop', 'lunch'])).toThrow(/Unknown schedule item/);
  });

  it('rejects an order that leaves out a session already on that day', () => {
    expect(() => reflowDay(base, 1, ['keynote', 'workshop'])).toThrow(/must include every session/);
  });

  it('rejects an order that would run past midnight, with a 400', () => {
    const long = [
      item('a', 1, '09:00', '14:00'),
      item('b', 1, '14:15', '19:15'),
      item('c', 1, '19:30', '23:30'),
      item('d', 1, '09:00', '14:00'),
    ];
    try {
      reflowDay(long, 1, ['d', 'a', 'b', 'c']);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(400);
      expect((error as AppError).message).toMatch(/not enough room/);
    }
  });
});
