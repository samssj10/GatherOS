import type { ScheduleItem } from '../types';

/** Where a session is relative to "now": check-in is open only while it is live. */
export type CheckInStatus = 'upcoming' | 'live' | 'ended';

/** Local midnight of a `YYYY-MM-DD` date. The mock event runs in the server's local time zone. */
export function parseEventDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Today's date as `YYYY-MM-DD` in the server's local time zone. */
export function todayAsEventDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function atTime(eventStart: Date, dayNumber: number, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(
    eventStart.getFullYear(),
    eventStart.getMonth(),
    eventStart.getDate() + dayNumber - 1,
    hours,
    minutes,
  );
}

/** When a session starts and ends on the calendar. Day 1 is the event start date. */
export function sessionWindow(
  item: Pick<ScheduleItem, 'day' | 'startTime' | 'endTime'>,
  eventStart: Date,
): { start: Date; end: Date } {
  return {
    start: atTime(eventStart, item.day, item.startTime),
    end: atTime(eventStart, item.day, item.endTime),
  };
}

/** Check-in opens when a session starts and closes when it ends. */
export function checkInStatus(
  item: Pick<ScheduleItem, 'day' | 'startTime' | 'endTime'>,
  now: Date,
  eventStart: Date,
): CheckInStatus {
  const { start, end } = sessionWindow(item, eventStart);
  if (now < start) return 'upcoming';
  if (now >= end) return 'ended';
  return 'live';
}
