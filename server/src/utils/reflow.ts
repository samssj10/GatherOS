import type { ScheduleItem } from '../types';
import { AppError } from './AppError';

/** Gap between back-to-back sessions, matching the 15-minute buffer the AI prompt asks for. */
export const BUFFER_MINUTES = 15;

const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

const toMinutes = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/**
 * Places `orderedIds` on `day` in that order and re-times the day: sessions run back to back,
 * each keeping its own duration, 15 minutes apart, starting at the earliest start time the day
 * already had. Items listed that sit on another day are moved here. Sessions on other days are
 * left untouched. Pure arithmetic: no AI involved.
 *
 * The client keeps an identical copy (client/src/utils/reflow.ts) for instant optimistic updates;
 * the server's result is always the authoritative one.
 */
export function reflowDay(items: ScheduleItem[], day: number, orderedIds: string[]): ScheduleItem[] {
  if (new Set(orderedIds).size !== orderedIds.length) {
    throw AppError.badRequest('itemIds must not contain duplicates');
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = orderedIds.map((id) => {
    const item = byId.get(id);
    if (!item) throw AppError.badRequest(`Unknown schedule item ${id}`);
    return item;
  });

  const alreadyOnDay = items.filter((item) => item.day === day);
  const listed = new Set(orderedIds);
  if (alreadyOnDay.some((item) => !listed.has(item.id))) {
    throw AppError.badRequest(`itemIds must include every session already on day ${day}`);
  }

  // Anchor to the day's existing start; a day with nothing on it keeps the first item's own start.
  const anchor =
    alreadyOnDay.length > 0
      ? Math.min(...alreadyOnDay.map((item) => toMinutes(item.startTime)))
      : toMinutes(ordered[0]?.startTime ?? '09:00');

  const retimed = new Map<string, ScheduleItem>();
  let cursor = anchor;
  for (const item of ordered) {
    const duration = toMinutes(item.endTime) - toMinutes(item.startTime);
    const end = cursor + duration;
    if (end > LAST_MINUTE_OF_DAY) {
      throw AppError.badRequest('There is not enough room left in that day for this order');
    }
    retimed.set(item.id, { ...item, day, startTime: toTime(cursor), endTime: toTime(end) });
    cursor = end + BUFFER_MINUTES;
  }

  return items.map((item) => retimed.get(item.id) ?? item);
}
