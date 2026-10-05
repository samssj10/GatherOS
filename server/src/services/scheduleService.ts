import type { AttendeeScheduleDTO, ScheduleItem } from '../types';
import { env } from '../utils/env';
import { checkInStatus, parseEventDate } from '../utils/eventClock';
import type { CheckInStatus } from '../utils/eventClock';
import { reflowDay } from '../utils/reflow';
import { applyTiming } from '../utils/restoreTiming';
import type { TimingEntry } from '../utils/restoreTiming';
import { db } from './mockDb';

export interface BudgetSummary {
  budget: number;
  estimatedSpend: number;
  remaining: number;
}

export function listSchedule(): ScheduleItem[] {
  return db.schedule;
}

export function getBudgetSummary(): BudgetSummary {
  const estimatedSpend = db.schedule.reduce((sum, item) => sum + item.costEstimate, 0);
  return {
    budget: db.eventBudget,
    estimatedSpend,
    remaining: db.eventBudget - estimatedSpend,
  };
}

/** The event's notion of "now": the real clock, unless EVENT_NOW pins it. */
export function eventNow(): Date {
  return env.EVENT_NOW ? new Date(env.EVENT_NOW) : new Date();
}

export function sessionCheckInStatus(item: ScheduleItem, now: Date = eventNow()): CheckInStatus {
  return checkInStatus(item, now, parseEventDate(env.EVENT_START_DATE));
}

// Meals and keynotes are open to everyone; workshops and activities need a headcount.
export function toAttendeeScheduleDTO(
  item: ScheduleItem,
  eventId: string,
  now: Date = eventNow(),
): AttendeeScheduleDTO {
  return {
    id: item.id,
    eventId,
    day: item.day,
    sessionTitle: item.title,
    startTime: item.startTime,
    endTime: item.endTime,
    locationName: item.location,
    category: item.category,
    isRsvpRequired: item.category === 'activity' || item.category === 'workshop',
    checkInStatus: sessionCheckInStatus(item, now),
  };
}

export function listAttendeeSchedule(eventId: string): AttendeeScheduleDTO[] {
  const now = eventNow();
  return db.schedule.map((item) => toAttendeeScheduleDTO(item, eventId, now));
}

export function reorderDay(day: number, itemIds: string[]): ScheduleItem[] {
  db.schedule = reflowDay(db.schedule, day, itemIds);
  return db.schedule;
}

/** Puts sessions back on the days and times they had (used to undo a move exactly). */
export function restoreTiming(entries: TimingEntry[]): ScheduleItem[] {
  db.schedule = applyTiming(db.schedule, entries);
  return db.schedule;
}

export function replaceSchedule(items: ScheduleItem[]): ScheduleItem[] {
  db.schedule = items.map((item) => ({ ...item }));
  return db.schedule;
}
