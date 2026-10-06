/** How many day columns a wide screen shows at once. A phone shows one (see the `perPage` arguments). */
export const DAYS_PER_PAGE = 3;

/** The board only pages once the trip is longer than one page. */
export function isPaged(dayCount: number, perPage = DAYS_PER_PAGE): boolean {
  return dayCount > perPage;
}

export function pageCount(dayCount: number, perPage = DAYS_PER_PAGE): number {
  return Math.max(1, Math.ceil(dayCount / perPage));
}

/** Keeps a page number inside the trip, e.g. after a draft with fewer days replaces a longer one. */
export function clampPage(page: number, dayCount: number, perPage = DAYS_PER_PAGE): number {
  return Math.max(0, Math.min(page, pageCount(dayCount, perPage) - 1));
}

/** The position (in the list of days) of the first day on a page. */
export function firstIndexOfPage(page: number, perPage = DAYS_PER_PAGE): number {
  return Math.max(0, page) * perPage;
}

/** The page (zero-based) that holds the day at a position in the list of days. */
export function pageOfIndex(index: number, perPage = DAYS_PER_PAGE): number {
  return Math.max(0, Math.floor(index / perPage));
}

/**
 * The page (zero-based) a day sits on, by its position in the list of days. Not by its number:
 * an attendee's list can skip a day nobody planned (1, 2, 4), and Day 4 is then third, on page 0.
 */
export function pageOfDay(days: readonly number[], day: number, perPage = DAYS_PER_PAGE): number {
  const position = days.indexOf(day);
  return position < 0 ? 0 : pageOfIndex(position, perPage);
}

/** The days shown on one page, out of every day of the trip. */
export function daysOnPage(days: readonly number[], page: number, perPage = DAYS_PER_PAGE): number[] {
  const start = firstIndexOfPage(clampPage(page, days.length, perPage), perPage);
  return days.slice(start, start + perPage);
}

/**
 * Names the days on a page: "Day 4", "Days 4–6" for a run, or "Days 1, 2 and 4" when the trip skips a
 * day (an attendee only sees days that have sessions, so a range would claim a day that is not there).
 */
export function daysLabel(shown: readonly number[]): string {
  if (shown.length === 0) return '';
  const first = shown[0];
  const last = shown[shown.length - 1];
  if (shown.length === 1) return `Day ${first}`;
  if (last - first === shown.length - 1) return `Days ${first}–${last}`;
  return `Days ${shown.slice(0, -1).join(', ')} and ${last}`;
}

/** The toolbar label: "Days 1–3 of 4". */
export function rangeLabel(days: readonly number[], page: number, perPage = DAYS_PER_PAGE): string {
  const shown = daysOnPage(days, page, perPage);
  return shown.length === 0 ? '' : `${daysLabel(shown)} of ${days.length}`;
}

export interface NeighbourPages {
  /** Label for the strip that leads to the previous page, e.g. "Days 1–3"; null on the first page. */
  previous: string | null;
  /** Label for the strip that leads to the next page, e.g. "Day 4"; null on the last page. */
  next: string | null;
}

export function neighbourPages(days: readonly number[], page: number, perPage = DAYS_PER_PAGE): NeighbourPages {
  const current = clampPage(page, days.length, perPage);
  const last = pageCount(days.length, perPage) - 1;
  return {
    previous: current > 0 ? daysLabel(daysOnPage(days, current - 1, perPage)) : null,
    next: current < last ? daysLabel(daysOnPage(days, current + 1, perPage)) : null,
  };
}
