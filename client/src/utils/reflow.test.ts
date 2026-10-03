import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '@/types';
import { reflowDay } from '@/utils/reflow';

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

// Mirrors the seeded itinerary: Day 1 keynote (60 min), workshop (105 min), lunch (75 min).
const base = [
  item('keynote', 1, '09:00', '10:00'),
  item('workshop', 1, '10:15', '12:00'),
  item('lunch', 1, '12:15', '13:30'),
  item('sprint', 2, '09:30', '11:30'),
  item('sailing', 2, '14:00', '17:00'),
];

const times = (items: ScheduleItem[] | null, day: number) =>
  (items ?? [])
    .filter((entry) => entry.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((entry) => `${entry.id} ${entry.startTime}-${entry.endTime}`);

describe('reflowDay', () => {
  it('re-times a reordered day back to back, 15 minutes apart, keeping each duration', () => {
    const result = reflowDay(base, 1, ['lunch', 'keynote', 'workshop']);
    expect(times(result, 1)).toEqual([
      'lunch 09:00-10:15',
      'keynote 10:30-11:30',
      'workshop 11:45-13:30',
    ]);
  });

  it('anchors to the earliest start the day already had', () => {
    const shifted = [item('a', 1, '08:00', '09:00'), item('b', 1, '10:00', '11:00')];
    expect(times(reflowDay(shifted, 1, ['b', 'a']), 1)).toEqual(['b 08:00-09:00', 'a 09:15-10:15']);
  });

  it('moves a session onto another day and re-times only that day', () => {
    const result = reflowDay(base, 2, ['keynote', 'sprint', 'sailing']);
    expect(times(result, 2)).toEqual(['keynote 09:30-10:30', 'sprint 10:45-12:45', 'sailing 13:00-16:00']);
    // The day it left is untouched, gap included.
    expect(times(result, 1)).toEqual(['workshop 10:15-12:00', 'lunch 12:15-13:30']);
  });

  it('keeps the moved session\'s own start time when the destination day is empty', () => {
    const result = reflowDay(base, 3, ['lunch']);
    expect(times(result, 3)).toEqual(['lunch 12:15-13:30']);
  });

  it('does not mutate its input', () => {
    const snapshot = JSON.stringify(base);
    reflowDay(base, 1, ['lunch', 'keynote', 'workshop']);
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it('returns null when the day would run past midnight', () => {
    const long = [
      item('a', 1, '09:00', '14:00'),
      item('b', 1, '14:15', '19:15'),
      item('c', 1, '19:30', '23:30'),
      item('d', 1, '09:00', '14:00'),
    ];
    expect(reflowDay(long, 1, ['d', 'a', 'b', 'c'])).toBeNull();
  });

  it('returns null for an unknown session id', () => {
    expect(reflowDay(base, 1, ['keynote', 'ghost'])).toBeNull();
  });
});
