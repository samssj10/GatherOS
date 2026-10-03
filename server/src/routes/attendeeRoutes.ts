import { Router } from 'express';
import * as controller from '../controllers/attendeeController';
import { requireAuth, requireRole, requireSelf, requireSelfOrPlanner } from '../middlewares/auth';
import { stampLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';

export const attendeeRouter = Router();

attendeeRouter.use(requireAuth);

attendeeRouter.get(
  '/',
  requireRole('planner'),
  validate({ query: controller.listAttendeesQuerySchema }),
  controller.listAttendees,
);
// Fixed paths must be registered before '/:id' so they are not parsed as an id.
attendeeRouter.get('/summary', requireRole('planner'), controller.getAttendeeSummary);
// Department-level aggregate for the attendee "team race"; contains no personal data.
attendeeRouter.get('/departments', controller.getDepartmentStats);
// Mock reminder: with no ids, nudges every pending attendee. Sends nothing.
attendeeRouter.post(
  '/nudge',
  requireRole('planner'),
  validate({ body: controller.nudgeBodySchema }),
  controller.nudgeAttendees,
);
attendeeRouter.get(
  '/:id',
  validate({ params: controller.attendeeParamsSchema }),
  requireSelfOrPlanner,
  controller.getAttendee,
);
attendeeRouter.patch(
  '/:id',
  validate({ params: controller.attendeeParamsSchema, body: controller.updateAttendeeBodySchema }),
  requireSelfOrPlanner,
  controller.updateAttendee,
);
// Check in to a session to collect its stamp. Attendees only, and only for themselves.
attendeeRouter.post(
  '/:id/stamps',
  validate({ params: controller.attendeeParamsSchema, body: controller.stampBodySchema }),
  requireSelf,
  stampLimiter,
  controller.addStamp,
);
