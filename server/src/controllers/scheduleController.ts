import type { RequestHandler } from 'express';
import { getSession } from '../middlewares/auth';
import * as scheduleService from '../services/scheduleService';

export const listSchedule: RequestHandler = (_req, res) => {
  res.json(scheduleService.listSchedule());
};

export const listMySchedule: RequestHandler = (_req, res) => {
  res.json(scheduleService.listAttendeeSchedule(getSession(res).eventId));
};

export const getBudgetSummary: RequestHandler = (_req, res) => {
  res.json(scheduleService.getBudgetSummary());
};
