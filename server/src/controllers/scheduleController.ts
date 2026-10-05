import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getSession } from '../middlewares/auth';
import * as checkInService from '../services/checkInService';
import * as scheduleService from '../services/scheduleService';
import { MAX_EVENT_DAYS, MAX_SCHEDULE_ITEMS, scheduleItemSchema } from '../utils/scheduleSchema';

export const listSchedule: RequestHandler = (_req, res) => {
  res.json(scheduleService.listSchedule());
};

export const listMySchedule: RequestHandler = (_req, res) => {
  res.json(scheduleService.listAttendeeSchedule(getSession(res).eventId));
};

export const sessionParamsSchema = z.object({
  id: z.string().regex(/^[\w-]{1,60}$/, 'Invalid session id'),
});

export const getCheckInCode: RequestHandler = (_req, res) => {
  const { id } = res.locals.validated.params as z.infer<typeof sessionParamsSchema>;
  res.json(checkInService.getRoomCode(id));
};

export const getBudgetSummary: RequestHandler = (_req, res) => {
  res.json(scheduleService.getBudgetSummary());
};

export const reorderDayParamsSchema = z.object({
  day: z.coerce.number().int().min(1).max(MAX_EVENT_DAYS),
});

export const reorderDayBodySchema = z
  .object({ itemIds: z.array(z.string().regex(/^[\w-]{1,60}$/)).min(1).max(60) })
  .strict();

export const replaceScheduleBodySchema = z
  .object({ items: z.array(scheduleItemSchema).min(1).max(MAX_SCHEDULE_ITEMS) })
  .strict()
  .refine((body) => new Set(body.items.map((item) => item.id)).size === body.items.length, {
    message: 'Schedule item ids must be unique',
    path: ['items'],
  });

export const reorderDay: RequestHandler = (_req, res) => {
  const { day } = res.locals.validated.params as z.infer<typeof reorderDayParamsSchema>;
  const { itemIds } = res.locals.validated.body as z.infer<typeof reorderDayBodySchema>;
  res.json(scheduleService.reorderDay(day, itemIds));
};

export const replaceSchedule: RequestHandler = (_req, res) => {
  const { items } = res.locals.validated.body as z.infer<typeof replaceScheduleBodySchema>;
  res.json(scheduleService.replaceSchedule(items));
};
