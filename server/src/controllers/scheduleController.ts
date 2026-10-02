import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getSession } from '../middlewares/auth';
import * as scheduleService from '../services/scheduleService';
import { MAX_EVENT_DAYS, scheduleItemSchema } from '../utils/scheduleSchema';

export const listSchedule: RequestHandler = (_req, res) => {
  res.json(scheduleService.listSchedule());
};

export const listMySchedule: RequestHandler = (_req, res) => {
  res.json(scheduleService.listAttendeeSchedule(getSession(res).eventId));
};

export const getBudgetSummary: RequestHandler = (_req, res) => {
  res.json(scheduleService.getBudgetSummary());
};

export const scheduleItemParamsSchema = z.object({
  id: z.string().regex(/^[\w-]{1,60}$/, 'Invalid schedule item id'),
});

export const moveScheduleItemBodySchema = z
  .object({ day: z.number().int().min(1).max(MAX_EVENT_DAYS) })
  .strict();

export const replaceScheduleBodySchema = z
  .object({ items: z.array(scheduleItemSchema).min(1).max(60) })
  .strict()
  .refine((body) => new Set(body.items.map((item) => item.id)).size === body.items.length, {
    message: 'Schedule item ids must be unique',
    path: ['items'],
  });

export const moveScheduleItem: RequestHandler = (_req, res) => {
  const { id } = res.locals.validated.params as z.infer<typeof scheduleItemParamsSchema>;
  const { day } = res.locals.validated.body as z.infer<typeof moveScheduleItemBodySchema>;
  res.json(scheduleService.moveScheduleItem(id, day));
};

export const replaceSchedule: RequestHandler = (_req, res) => {
  const { items } = res.locals.validated.body as z.infer<typeof replaceScheduleBodySchema>;
  res.json(scheduleService.replaceSchedule(items));
};
