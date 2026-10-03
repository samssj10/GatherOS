import type { RequestHandler } from 'express';
import { z } from 'zod';
import * as attendeeService from '../services/attendeeService';
import * as checkInService from '../services/checkInService';

export const listAttendeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(2500).default(100),
  search: z.string().trim().min(1).max(100).optional(),
  rsvpStatus: z.enum(['accepted', 'declined', 'pending']).optional(),
  department: z.string().trim().min(1).max(50).optional(),
});

export const attendeeParamsSchema = z.object({
  id: z.string().regex(/^att-\d{4}$/, 'Invalid attendee id'),
});

export const updateAttendeeBodySchema = z
  .object({
    rsvpStatus: z.enum(['accepted', 'declined', 'pending']).optional(),
    dietaryPreference: z.enum(['none', 'vegetarian', 'vegan', 'gluten-free']).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const nudgeBodySchema = z
  .object({ ids: z.array(z.string().regex(/^att-\d{4}$/)).min(1).max(2500).optional() })
  .strict();

export const stampBodySchema = z
  .object({
    sessionId: z.string().regex(/^[\w-]{1,60}$/, 'Invalid session id'),
    // Any text is accepted here; a wrong code is a CODE_INVALID answer, not a validation error.
    code: z.string().trim().min(1, 'Enter the room code').max(20),
  })
  .strict();

export const listAttendees: RequestHandler = (_req, res) => {
  const query = res.locals.validated.query as z.infer<typeof listAttendeesQuerySchema>;
  res.json(attendeeService.listAttendees(query));
};

export const getAttendeeSummary: RequestHandler = (_req, res) => {
  res.json(attendeeService.getAttendeeSummary());
};

export const getAttendee: RequestHandler = (_req, res) => {
  const { id } = res.locals.validated.params as z.infer<typeof attendeeParamsSchema>;
  res.json(attendeeService.getAttendeeById(id));
};

export const updateAttendee: RequestHandler = (_req, res) => {
  const { id } = res.locals.validated.params as z.infer<typeof attendeeParamsSchema>;
  const body = res.locals.validated.body as z.infer<typeof updateAttendeeBodySchema>;
  res.json(attendeeService.updateAttendee(id, body));
};

export const getDepartmentStats: RequestHandler = (_req, res) => {
  res.json(attendeeService.getDepartmentStats());
};

export const nudgeAttendees: RequestHandler = (_req, res) => {
  const { ids } = res.locals.validated.body as z.infer<typeof nudgeBodySchema>;
  res.json(attendeeService.nudgeAttendees(ids));
};

export const addStamp: RequestHandler = (_req, res) => {
  const { id } = res.locals.validated.params as z.infer<typeof attendeeParamsSchema>;
  const { sessionId, code } = res.locals.validated.body as z.infer<typeof stampBodySchema>;
  res.status(201).json(checkInService.checkIn(id, sessionId, code));
};
