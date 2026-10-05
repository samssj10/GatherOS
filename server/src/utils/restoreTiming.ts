import type { ScheduleItem } from '../types';
import { AppError } from './AppError';

export interface TimingEntry {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
}

/**
 * Puts the listed sessions back on the given day and times, leaving every other field and every
 * other session alone. Used to undo a move exactly: re-timing a day is not reversible by moving
 * the session back, because the other sessions on both days were shifted too.
 *
 * The client keeps a copy (client/src/utils/restoreTiming.ts) for the instant optimistic update.
 */
export function applyTiming(items: ScheduleItem[], entries: TimingEntry[]): ScheduleItem[] {
  const known = new Set(items.map((item) => item.id));
  const unknown = entries.filter((entry) => !known.has(entry.id)).map((entry) => entry.id);
  if (unknown.length > 0) {
    throw new AppError(422, 'Some of those sessions no longer exist', 'UNKNOWN_SESSION', { ids: unknown });
  }

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return items.map((item) => {
    const entry = byId.get(item.id);
    return entry ? { ...item, day: entry.day, startTime: entry.startTime, endTime: entry.endTime } : item;
  });
}
