import type { RequestHandler } from 'express';
import type { z } from 'zod';
import * as aiService from '../services/aiService';
import { generateScheduleBodySchema } from '../utils/scheduleSchema';

export { generateScheduleBodySchema };

export const generateSchedule: RequestHandler = async (_req, res) => {
  const body = res.locals.validated.body as z.infer<typeof generateScheduleBodySchema>;
  const items = await aiService.generateSchedule(body);
  res.json({ items });
};
