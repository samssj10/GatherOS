import { z } from 'zod';

export const SCHEDULE_CATEGORIES = ['workshop', 'keynote', 'meal', 'activity'] as const;
/** Longest offsite the planner can draft or save. Mirrored by MAX_EVENT_DAYS in client/src/utils/eventLength.ts. */
export const MAX_EVENT_DAYS = 7;
/** Upper bound on sessions in one saved itinerary. */
export const MAX_SCHEDULE_ITEMS = 150;

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

/** Body of POST /api/ai/generate-schedule. Lives here (not in the controller) so it can be tested without the server env. */
export const generateScheduleBodySchema = z
  .object({
    prompt: z.string().trim().min(3).max(500),
    city: z.string().trim().min(2).max(80).optional(),
    days: z.number().int().min(1).max(MAX_EVENT_DAYS),
    attendeeCount: z.number().int().min(1).max(2500),
    budget: z.number().positive().max(10_000_000).optional(),
  })
  .strict();

/** One session's day and times: what "undo a move" puts back. Nothing else about a session can change this way. */
export const timingEntrySchema = z
  .object({
    id: z.string().min(1).max(60),
    day: z.number().int().min(1).max(MAX_EVENT_DAYS),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .strict()
  .refine((entry) => entry.startTime < entry.endTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export const restoreTimingBodySchema = z
  .object({ items: z.array(timingEntrySchema).min(1).max(MAX_SCHEDULE_ITEMS) })
  .strict()
  .refine((body) => new Set(body.items.map((entry) => entry.id)).size === body.items.length, {
    message: 'Session ids must be unique',
    path: ['items'],
  });
