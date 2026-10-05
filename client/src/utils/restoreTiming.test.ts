import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '@/types';
import { reflowDay } from './reflow';
import { applyTiming, timingsOf } from './restoreTiming';

const item = (id: string, day: number, startTime: string, endTime: string): ScheduleItem => ({
  id,
  day,
  startTime,
  endTime,
  title: id,
  description: '',
  location: '',
  category: 'meal',
  costEstimate: 10,
});

// Day 1 has a gap between its sessions; so does day 4.
const original = [
  item('a', 1, '09:00', '10:00'),
  item('b', 1, '12:00', '13:00'),
  item('c', 4, '09:00', '10:00'),
  item('d', 4, '14:00', '16:00'),
];

describe('timingsOf', () => {
  it('keeps only the id, day and times', () => {
    expect(timingsOf([original[0]])).toEqual([{ id: 'a', day: 1, startTime: '09:00', endTime: '10:00' }]);
  });
});

describe('applyTiming', () => {
  it('changes only the listed sessions, and only their day and times', () => {
    const result = applyTiming(original, [{ id: 'b', day: 2, startTime: '08:00', endTime: '09:00' }]);
    expect(result[1]).toEqual({ ...original[1], day: 2, startTime: '08:00', endTime: '09:00' });
    expect(result[0]).toBe(original[0]);
    expect(result[2]).toBe(original[2]);
  });

  it('undoes a move exactly, including the gaps that re-timing closed', () => {
    const moved = reflowDay(original, 4, ['c', 'd', 'a']);
    expect(moved).not.toEqual(original);
    expect(applyTiming(moved ?? [], timingsOf(original))).toEqual(original);
  });
});
