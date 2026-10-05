import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EVENT_DAYS,
  MAX_EVENT_DAYS,
  describeResolvedDays,
  parseRequestedDays,
  resolveDays,
} from './eventLength';

describe('parseRequestedDays', () => {
  it.each([
    ['5-day team retreat in Lisbon', 5],
    ['a 4 day offsite in Porto', 4],
    ['Retreat for 6 days in Rome', 6],
    ['five day leadership summit', 5],
    ['Two-day workshop in Berlin', 2],
    ['1 day away day', 1],
    ['10-day expedition', 10],
  ])('reads the day count in "%s"', (prompt, expected) => {
    expect(parseRequestedDays(prompt)).toBe(expected);
  });

  it('takes the longer end of a range', () => {
    expect(parseRequestedDays('3-5 days in Madrid')).toBe(5);
    expect(parseRequestedDays('three to four days in Madrid')).toBe(4);
  });

  it('understands weeks and weekends', () => {
    expect(parseRequestedDays('a week in Porto')).toBe(7);
    expect(parseRequestedDays('one-week retreat')).toBe(7);
    expect(parseRequestedDays('two weeks in Bali')).toBe(14);
    expect(parseRequestedDays('team weekend in the Alps')).toBe(2);
  });

  it('uses the first mention when several appear', () => {
    expect(parseRequestedDays('5-day retreat with one day of sailing')).toBe(5);
  });

  it('returns null when the prompt gives no length', () => {
    expect(parseRequestedDays('team retreat in Lisbon with a sailing day')).toBeNull();
    expect(parseRequestedDays('Day 2 should be outdoors')).toBeNull();
    expect(parseRequestedDays('')).toBeNull();
  });

  it('ignores a zero length', () => {
    expect(parseRequestedDays('0 days of fun')).toBeNull();
  });
});

describe('resolveDays', () => {
  it('falls back to the default length', () => {
    expect(resolveDays('team retreat', null)).toEqual({
      days: DEFAULT_EVENT_DAYS,
      source: 'default',
      cappedFrom: null,
    });
  });

  it('uses the prompt when nothing is chosen by hand', () => {
    expect(resolveDays('5-day retreat', null)).toEqual({ days: 5, source: 'prompt', cappedFrom: null });
  });

  it('lets an explicit choice override the prompt', () => {
    expect(resolveDays('5-day retreat', 2)).toEqual({ days: 2, source: 'manual', cappedFrom: null });
  });

  it('caps a longer request and remembers what was asked for', () => {
    expect(resolveDays('two weeks in Bali', null)).toEqual({
      days: MAX_EVENT_DAYS,
      source: 'prompt',
      cappedFrom: 14,
    });
  });
});

describe('describeResolvedDays', () => {
  it('explains where the number came from', () => {
    expect(describeResolvedDays(resolveDays('5-day retreat', null))).toBe('Planning 5 days, from your prompt.');
    expect(describeResolvedDays(resolveDays('retreat', 1))).toBe('Planning 1 day.');
    expect(describeResolvedDays(resolveDays('retreat', null))).toContain('Planning 3 days.');
    expect(describeResolvedDays(resolveDays('two weeks', null))).toContain('you asked for 14');
  });
});
