import type { ScheduleItem } from '../types';
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
