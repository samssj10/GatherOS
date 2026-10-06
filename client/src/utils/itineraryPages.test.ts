import { describe, expect, it } from 'vitest';
import {
  clampPage,
  daysLabel,
  daysOnPage,
  firstIndexOfPage,
  isPaged,
  neighbourPages,
  pageCount,
  pageOfDay,
  pageOfIndex,
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
  it('names a single day, a run or a list when the trip skips a day', () => {
    expect(daysLabel([4])).toBe('Day 4');
    expect(daysLabel([4, 5, 6])).toBe('Days 4–6');
    expect(daysLabel([1, 2, 4])).toBe('Days 1, 2 and 4');
    expect(daysLabel([])).toBe('');
  });

  it('labels a page that skips a day by the days it really has', () => {
    expect(rangeLabel([1, 2, 4, 5], 0)).toBe('Days 1, 2 and 4 of 4');
    expect(neighbourPages([1, 2, 4, 5], 0)).toEqual({ previous: null, next: 'Day 5' });
  });

  it('writes the toolbar range', () => {
    expect(rangeLabel(days(4), 0)).toBe('Days 1–3 of 4');
    expect(rangeLabel(days(4), 1)).toBe('Day 4 of 4');
    expect(rangeLabel(days(7), 1)).toBe('Days 4–6 of 7');
    expect(rangeLabel([], 0)).toBe('');
  });
});

describe('a page size other than three (a phone shows one day)', () => {
  it('pages one day at a time', () => {
    expect(isPaged(3, 1)).toBe(true);
    expect(isPaged(1, 1)).toBe(false);
    expect(pageCount(5, 1)).toBe(5);
    expect(daysOnPage(days(5), 2, 1)).toEqual([3]);
    expect(daysOnPage(days(5), 9, 1)).toEqual([5]);
    expect(pageOfDay(days(5), 4, 1)).toBe(3);
  });

  it('labels a single-day page and its neighbours', () => {
    expect(rangeLabel(days(5), 1, 1)).toBe('Day 2 of 5');
    expect(neighbourPages(days(5), 0, 1)).toEqual({ previous: null, next: 'Day 2' });
    expect(neighbourPages(days(5), 4, 1)).toEqual({ previous: 'Day 4', next: null });
  });

  it('clamps with the page size in mind', () => {
    expect(clampPage(7, 5, 1)).toBe(4);
    expect(clampPage(7, 5, 3)).toBe(1);
  });

  it('knows where a page starts and which page holds a position', () => {
    expect(firstIndexOfPage(2, 3)).toBe(6);
    expect(firstIndexOfPage(2, 1)).toBe(2);
    expect(firstIndexOfPage(-1, 3)).toBe(0);
    expect(pageOfIndex(7, 3)).toBe(2);
    expect(pageOfIndex(7, 1)).toBe(7);
  });

  it('keeps you on the day you were looking at when the page size changes', () => {
    // On a wide screen the second page starts at the fourth day (position 3).
    const anchor = firstIndexOfPage(1, 3);
    // Turn to a phone, one day per page: that same first day is what is shown.
    expect(daysOnPage(days(7), pageOfIndex(anchor, 1), 1)).toEqual([4]);
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
