import { useEffect, useRef } from 'react';
import type { ScheduleItem } from '@/types';
import { byStartTime } from '@/utils/dropTarget';

/** Which control on a session card to give focus back to after the session has moved. */
export type MoveControl = 'earlier' | 'later' | 'previous-day' | 'next-day' | 'day' | 'handle';

interface PendingFocus {
  itemId: string;
  control: MoveControl;
  /** Where the session was, so focus can stay in that list if the session leaves the screen. */
  day: number;
  index: number;
  at: number;
}

/** Long enough for the optimistic update to land, short enough that a stale request cannot grab focus later. */
const MAX_WAIT_MS = 3000;

/**
 * Moving a session re-renders it in another column or position, which destroys the button that was
 * pressed and drops keyboard focus to the top of the page. Call the returned function when a move is
 * accepted: once the board has re-drawn, focus goes back to the same kind of control on the moved card,
 * or to the card itself when that control is disabled (it reached the first or last day or place), or,
 * when the session left the page, to the card now sitting where it was.
 */
export function useMoveFocus(items: readonly ScheduleItem[]) {
  const pending = useRef<PendingFocus | null>(null);

  useEffect(() => {
    const target = pending.current;
    if (!target) return;
    if (Date.now() - target.at > MAX_WAIT_MS) {
      pending.current = null;
      return;
    }

    const card = document.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(target.itemId)}"]`);
    if (card) {
      const control =
        target.control === 'handle'
          ? card.querySelector<HTMLElement>('[data-testid="drag-handle"]')
          : card.querySelector<HTMLElement>(`[data-move="${target.control}"]`);
      const usable = control !== null && !(control instanceof HTMLButtonElement && control.disabled);
      (usable ? control : card).focus();
    } else {
      const cards = document.querySelectorAll<HTMLElement>(
        `[data-testid="day-column-${target.day}"] [data-testid="schedule-card"]`,
      );
      const successor = cards[Math.min(target.index, cards.length - 1)];
      (successor ?? document.getElementById('itinerary'))?.focus();
    }
    pending.current = null;
  }, [items]);

  return (item: ScheduleItem, control: MoveControl) => {
    const sameDay = items.filter((entry) => entry.day === item.day).sort(byStartTime);
    pending.current = {
      itemId: item.id,
      control,
      day: item.day,
      index: Math.max(0, sameDay.findIndex((entry) => entry.id === item.id)),
      at: Date.now(),
    };
  };
}
