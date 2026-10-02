import type { RequestHandler } from 'express';
import { z } from 'zod';
import * as attendeeService from '../services/attendeeService';

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
