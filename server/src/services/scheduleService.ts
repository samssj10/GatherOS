import type { AttendeeScheduleDTO, ScheduleItem } from '../types';
import { reflowDay } from '../utils/reflow';
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

// Meals and keynotes are open to everyone; workshops and activities need a headcount.
export function toAttendeeScheduleDTO(item: ScheduleItem, eventId: string): AttendeeScheduleDTO {
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
  };
}

export function listAttendeeSchedule(eventId: string): AttendeeScheduleDTO[] {
  return db.schedule.map((item) => toAttendeeScheduleDTO(item, eventId));
}

export function reorderDay(day: number, itemIds: string[]): ScheduleItem[] {
  db.schedule = reflowDay(db.schedule, day, itemIds);
  return db.schedule;
}

export function replaceSchedule(items: ScheduleItem[]): ScheduleItem[] {
  db.schedule = items.map((item) => ({ ...item }));
  return db.schedule;
}
