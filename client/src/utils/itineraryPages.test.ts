import { describe, expect, it } from 'vitest';
import {
  clampPage,
  daySpanLabel,
  daysOnPage,
  isPaged,
  neighbourPages,
  pageCount,
  pageOfDay,
  rangeLabel,
} from './itineraryPages';

const days = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

describe('isPaged and pageCount', () => {
  it('does not page a trip of three days or fewer', () => {
    expect(isPaged(1)).toBe(false);
    expect(isPaged(3)).toBe(false);
    expect(pageCount(3)).toBe(1);
  });

  it('pages from the fourth day, three days to a page', () => {
    expect(isPaged(4)).toBe(true);
    expect(pageCount(4)).toBe(2);
    expect(pageCount(6)).toBe(2);
    expect(pageCount(7)).toBe(3);
  });

  it('always has at least one page', () => {
    expect(pageCount(0)).toBe(1);
  });
});

describe('clampPage', () => {
  it('keeps a page inside the trip', () => {
    expect(clampPage(5, 4)).toBe(1);
    expect(clampPage(-1, 4)).toBe(0);
    expect(clampPage(2, 7)).toBe(2);
  });

  it('falls back to the first page when the trip shrinks to fit on one', () => {
    expect(clampPage(2, 3)).toBe(0);
  });
});

describe('pageOfDay', () => {
  it('maps each day to its page', () => {
    expect(days(7).map((day) => pageOfDay(days(7), day))).toEqual([0, 0, 0, 1, 1, 1, 2]);
  });

  it('goes by position, so a skipped day number does not push later days onto the wrong page', () => {
    const skipped = [1, 2, 4, 5];
    expect(skipped.map((day) => pageOfDay(skipped, day))).toEqual([0, 0, 0, 1]);
    expect(daysOnPage(skipped, 0)).toEqual([1, 2, 4]);
  });

  it('falls back to the first page for a day that is not in the list', () => {
    expect(pageOfDay([1, 2, 3], 9)).toBe(0);
  });
});

describe('daysOnPage', () => {
  it('returns three days per page', () => {
    expect(daysOnPage(days(7), 0)).toEqual([1, 2, 3]);
    expect(daysOnPage(days(7), 1)).toEqual([4, 5, 6]);
  });

  it('returns what is left on a partial last page', () => {
    expect(daysOnPage(days(7), 2)).toEqual([7]);
    expect(daysOnPage(days(4), 1)).toEqual([4]);
  });

  it('clamps an out-of-range page', () => {
    expect(daysOnPage(days(4), 9)).toEqual([4]);
  });
});

describe('labels', () => {
  it('names a single day or a span', () => {
    expect(daySpanLabel(4, 4)).toBe('Day 4');
    expect(daySpanLabel(4, 6)).toBe('Days 4–6');
  });

  it('writes the toolbar range', () => {
    expect(rangeLabel(days(4), 0)).toBe('Days 1–3 of 4');
    expect(rangeLabel(days(4), 1)).toBe('Day 4 of 4');
    expect(rangeLabel(days(7), 1)).toBe('Days 4–6 of 7');
    expect(rangeLabel([], 0)).toBe('');
  });
});

describe('neighbourPages', () => {
  it('has only a next strip on the first page', () => {
    expect(neighbourPages(days(4), 0)).toEqual({ previous: null, next: 'Day 4' });
  });

  it('has only a previous strip on the last page', () => {
    expect(neighbourPages(days(4), 1)).toEqual({ previous: 'Days 1–3', next: null });
  });

  it('has both strips in the middle of a long trip', () => {
    expect(neighbourPages(days(7), 1)).toEqual({ previous: 'Days 1–3', next: 'Day 7' });
  });

  it('has none when everything fits on one page', () => {
    expect(neighbourPages(days(3), 0)).toEqual({ previous: null, next: null });
  });
});
