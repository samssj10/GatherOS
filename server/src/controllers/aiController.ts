import type { RequestHandler } from 'express';
import { z } from 'zod';
import * as aiService from '../services/aiService';

export const generateScheduleBodySchema = z
  .object({
    prompt: z.string().trim().min(3).max(500),
    city: z.string().trim().min(2).max(80),
    days: z.number().int().min(1).max(3),
    attendeeCount: z.number().int().min(1).max(2500),
    budget: z.number().positive().max(10_000_000).optional(),
  })
  .strict();

export const generateSchedule: RequestHandler = async (_req, res) => {
  const body = res.locals.validated.body as z.infer<typeof generateScheduleBodySchema>;
  const items = await aiService.generateSchedule(body);
  res.json({ items });
};
