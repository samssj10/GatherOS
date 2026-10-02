import type { RequestHandler } from 'express';
import * as scheduleService from '../services/scheduleService';

export const listSchedule: RequestHandler = (_req, res) => {
  res.json(scheduleService.listSchedule());
};

export const getBudgetSummary: RequestHandler = (_req, res) => {
  res.json(scheduleService.getBudgetSummary());
};
