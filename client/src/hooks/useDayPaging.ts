import { useEffect, useRef, useState } from 'react';
import {
  clampPage,
  daysOnPage,
  isPaged,
  neighbourPages,
  pageCount,
  pageOfDay,
} from '@/utils/itineraryPages';

/**
 * Which three days of a long trip are on screen. Shared by the planner's itinerary board and the
 * attendee's journey so both page the same way: the current page, the days and neighbour labels
 * for it, and focus that follows a page turn.
 *
 * `days` is every day of the trip in order. `initialPage` only matters on the first render.
 */
export function useDayPaging(days: readonly number[], initialPage = 0) {
  const [page, setPage] = useState(initialPage);
  const previousButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const focusAfterTurn = useRef<'previous' | 'next' | null>(null);

  const dayCount = days.length;
  const paged = isPaged(dayCount);
  const currentPage = clampPage(page, dayCount);
  const visibleDays = paged ? daysOnPage(days, currentPage) : [...days];
  const neighbours = neighbourPages(days, currentPage);

  // A button that turns the page may disable or remove itself, so hand focus to the one that still works.
  useEffect(() => {
    const wanted = focusAfterTurn.current;
    focusAfterTurn.current = null;
    if (!wanted) return;
    const canNext = currentPage < pageCount(dayCount) - 1;
    const canPrevious = currentPage > 0;
    const useNext = wanted === 'next' ? canNext || !canPrevious : !canPrevious && canNext;
    (useNext ? nextButton : previousButton).current?.focus();
  }, [currentPage, dayCount]);

  /** Turns to a page. Pass the direction when a button was used, so focus can follow. */
  const turnPage = (target: number, direction?: 'previous' | 'next') => {
    const next = clampPage(target, dayCount);
    if (next === currentPage) return;
    focusAfterTurn.current = direction ?? null;
    setPage(next);
  };

  return {
    paged,
    page: currentPage,
    visibleDays,
    neighbours,
    turnPage,
    /** Turns to whichever page holds `day`. */
    showDay: (day: number) => turnPage(pageOfDay(days, day)),
    previous: () => turnPage(currentPage - 1, 'previous'),
    next: () => turnPage(currentPage + 1, 'next'),
    resetPage: () => setPage(0),
    previousButton,
    nextButton,
  };
}
