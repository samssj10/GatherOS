import type { Active, Over } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { ScheduleItem } from '@/types';

/** Droppable ids: a day column's empty space, and a Day button in the jump bar. */
export const COLUMN_PREFIX = 'day-';
export const CHIP_PREFIX = 'chip-';

export const byStartTime = (a: ScheduleItem, b: ScheduleItem) => a.startTime.localeCompare(b.startTime);

export const idsOnDay = (items: ScheduleItem[], day: number): string[] =>
  items
    .filter((item) => item.day === day)
    .sort(byStartTime)
    .map((item) => item.id);

export interface DropTarget {
  day: number;
  /** Every session that should be on `day` afterwards, in order. */
  orderedIds: string[];
  /** Where the dragged card lands among the destination day's other cards (cross-day only). */
  index: number;
  crossDay: boolean;
  /** True when the card was dropped on a Day button rather than on the board. */
  viaDayButton: boolean;
}

/** The day a droppable id stands for when it is a column or a Day button; null for a card. */
function dayOfContainer(overId: string): { day: number; viaDayButton: boolean } | null {
  if (overId.startsWith(COLUMN_PREFIX)) return { day: Number(overId.slice(COLUMN_PREFIX.length)), viaDayButton: false };
  if (overId.startsWith(CHIP_PREFIX)) return { day: Number(overId.slice(CHIP_PREFIX.length)), viaDayButton: true };
  return null;
}

/** Turns "dragged card X is over Y" into the day, the new order and the landing index. */
export function resolveDrop(active: Active, over: Over | null, items: ScheduleItem[]): DropTarget | null {
  if (!over) return null;
  const dragged = items.find((item) => item.id === String(active.id));
  if (!dragged) return null;

  const overId = String(over.id);

  // Dropped on a column's empty space or on a Day button: append to the end of that day.
  const container = dayOfContainer(overId);
  if (container) {
    if (container.day === dragged.day) return null;
    const destination = idsOnDay(items, container.day);
    return {
      day: container.day,
      orderedIds: [...destination, dragged.id],
      index: destination.length,
      crossDay: true,
      viaDayButton: container.viaDayButton,
    };
  }

  // Dropped on another card.
  const target = items.find((item) => item.id === overId);
  if (!target || target.id === dragged.id) return null;

  if (target.day === dragged.day) {
    const ids = idsOnDay(items, target.day);
    const to = ids.indexOf(target.id);
    return {
      day: target.day,
      orderedIds: arrayMove(ids, ids.indexOf(dragged.id), to),
      index: to,
      crossDay: false,
      viaDayButton: false,
    };
  }

  // Another day: land before or after the hovered card, depending on which half the pointer is in.
  const destination = idsOnDay(items, target.day);
  const translated = active.rect.current.translated;
  const below = translated
    ? translated.top + translated.height / 2 > over.rect.top + over.rect.height / 2
    : false;
  const index = destination.indexOf(target.id) + (below ? 1 : 0);
  return {
    day: target.day,
    orderedIds: [...destination.slice(0, index), dragged.id, ...destination.slice(index)],
    index,
    crossDay: true,
    viaDayButton: false,
  };
}
