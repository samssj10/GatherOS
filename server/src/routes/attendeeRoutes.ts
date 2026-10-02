import { Router } from 'express';
import * as controller from '../controllers/attendeeController';
import { requireAuth, requireRole, requireSelfOrPlanner } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

export const attendeeRouter = Router();

attendeeRouter.use(requireAuth);

attendeeRouter.get(
  '/',
  requireRole('planner'),
  validate({ query: controller.listAttendeesQuerySchema }),
  controller.listAttendees,
);
// Must be registered before '/:id' so "summary" is not parsed as an id.
attendeeRouter.get('/summary', requireRole('planner'), controller.getAttendeeSummary);
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
