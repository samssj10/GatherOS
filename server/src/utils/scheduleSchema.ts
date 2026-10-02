import { z } from 'zod';

export const SCHEDULE_CATEGORIES = ['workshop', 'keynote', 'meal', 'activity'] as const;
export const MAX_EVENT_DAYS = 3;

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

/** Runtime contract for ScheduleItem, shared by AI output validation and the save endpoint. */
export const scheduleItemSchema = z
  .object({
    id: z.string().min(1).max(60),
    day: z.number().int().min(1).max(MAX_EVENT_DAYS),
    startTime: timeSchema,
    endTime: timeSchema,
    title: z.string().min(1).max(160),
    description: z.string().max(1000),
    location: z.string().max(200),
    category: z.enum(SCHEDULE_CATEGORIES),
    costEstimate: z.number().min(0).max(10_000_000),
  })
  .refine((item) => item.startTime < item.endTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });
