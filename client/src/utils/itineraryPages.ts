/** How many day columns the itinerary board shows at once. */
export const DAYS_PER_PAGE = 3;

/** The board only pages once the trip is longer than one page. */
export function isPaged(dayCount: number): boolean {
  return dayCount > DAYS_PER_PAGE;
}

export function pageCount(dayCount: number): number {
  return Math.max(1, Math.ceil(dayCount / DAYS_PER_PAGE));
}

/** Keeps a page number inside the trip, e.g. after a draft with fewer days replaces a longer one. */
export function clampPage(page: number, dayCount: number): number {
  return Math.max(0, Math.min(page, pageCount(dayCount) - 1));
}

/** The page (zero-based) a day sits on. Days are numbered from 1. */
export function pageOfDay(day: number): number {
  return Math.max(0, Math.floor((day - 1) / DAYS_PER_PAGE));
}

/** The days shown on one page, out of every day of the trip. */
export function daysOnPage(days: readonly number[], page: number): number[] {
  const start = clampPage(page, days.length) * DAYS_PER_PAGE;
  return days.slice(start, start + DAYS_PER_PAGE);
}

/** "Day 4" for one day, "Days 4–6" for several. */
export function daySpanLabel(first: number, last: number): string {
  return first === last ? `Day ${first}` : `Days ${first}–${last}`;
}

/** The toolbar label: "Days 1–3 of 4". */
export function rangeLabel(days: readonly number[], page: number): string {
  const shown = daysOnPage(days, page);
  if (shown.length === 0) return '';
  return `${daySpanLabel(shown[0], shown[shown.length - 1])} of ${days.length}`;
}

export interface NeighbourPages {
  /** Label for the strip that leads to the previous page, e.g. "Days 1–3"; null on the first page. */
  previous: string | null;
  /** Label for the strip that leads to the next page, e.g. "Day 4"; null on the last page. */
  next: string | null;
}

export function neighbourPages(days: readonly number[], page: number): NeighbourPages {
  const current = clampPage(page, days.length);
  const last = pageCount(days.length) - 1;
  const span = (target: number) => {
    const shown = daysOnPage(days, target);
    return daySpanLabel(shown[0], shown[shown.length - 1]);
  };
  return {
    previous: current > 0 ? span(current - 1) : null,
    next: current < last ? span(current + 1) : null,
  };
}
