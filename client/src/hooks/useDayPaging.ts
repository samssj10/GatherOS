import { useEffect, useRef, useState } from 'react';
import {
  DAYS_PER_PAGE,
  clampPage,
  daysOnPage,
  firstIndexOfPage,
  isPaged,
  neighbourPages,
  pageCount,
  pageOfDay,
  pageOfIndex,
} from '@/utils/itineraryPages';

interface DayPagingOptions {
  /** The day to open on; only used on the first render. */
  initialDay?: number;
  /** How many days a page holds: three on a wide screen, one on a phone. */
  perPage?: number;
}

/**
 * Which days of a long trip are on screen. Shared by the planner's itinerary board and the
 * attendee's journey so both page the same way: the current page, the days and neighbour labels
 * for it, and focus that follows a page turn.
 *
 * `days` is every day of the trip in order. The hook remembers the first day on screen, not a page
 * number, so turning a phone sideways (a different `perPage`) keeps you on the day you were looking at.
 */
export function useDayPaging(days: readonly number[], { initialDay, perPage = DAYS_PER_PAGE }: DayPagingOptions = {}) {
  const [anchor, setAnchor] = useState(() => (initialDay === undefined ? 0 : Math.max(0, days.indexOf(initialDay))));
  const previousButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const focusAfterTurn = useRef<'previous' | 'next' | null>(null);

  const dayCount = days.length;
  const paged = isPaged(dayCount, perPage);
  const currentPage = clampPage(pageOfIndex(anchor, perPage), dayCount, perPage);
  const visibleDays = paged ? daysOnPage(days, currentPage, perPage) : [...days];
  const neighbours = neighbourPages(days, currentPage, perPage);

  // A button that turns the page may disable or remove itself, so hand focus to the one that still works.
  useEffect(() => {
    const wanted = focusAfterTurn.current;
    focusAfterTurn.current = null;
    if (!wanted) return;
    const canNext = currentPage < pageCount(dayCount, perPage) - 1;
    const canPrevious = currentPage > 0;
    const useNext = wanted === 'next' ? canNext || !canPrevious : !canPrevious && canNext;
    (useNext ? nextButton : previousButton).current?.focus();
  }, [currentPage, dayCount, perPage]);

  /** Turns to a page. Pass the direction when a button was used, so focus can follow. */
  const turnPage = (target: number, direction?: 'previous' | 'next') => {
    const next = clampPage(target, dayCount, perPage);
    if (next === currentPage) return;
    focusAfterTurn.current = direction ?? null;
    setAnchor(firstIndexOfPage(next, perPage));
  };

  return {
    paged,
    perPage,
    page: currentPage,
    visibleDays,
    neighbours,
    turnPage,
    /** Turns to whichever page holds `day`. */
    showDay: (day: number) => turnPage(pageOfDay(days, day, perPage)),
    previous: () => turnPage(currentPage - 1, 'previous'),
    next: () => turnPage(currentPage + 1, 'next'),
    resetPage: () => setAnchor(0),
    previousButton,
    nextButton,
  };
}
