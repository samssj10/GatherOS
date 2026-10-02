import { Router } from 'express';
import * as controller from '../controllers/scheduleController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

export const scheduleRouter = Router();

scheduleRouter.use(requireAuth);

// Attendee-shaped payload (AttendeeScheduleDTO) available to any signed-in user.
scheduleRouter.get('/me', controller.listMySchedule);
scheduleRouter.get('/', requireRole('planner'), controller.listSchedule);
scheduleRouter.get('/budget', requireRole('planner'), controller.getBudgetSummary);

// Planner-only edits: save a whole itinerary (e.g. an accepted AI draft) or move one session.
scheduleRouter.put(
  '/',
  requireRole('planner'),
  validate({ body: controller.replaceScheduleBodySchema }),
  controller.replaceSchedule,
);
scheduleRouter.patch(
  '/:id',
  requireRole('planner'),
  validate({
    params: controller.scheduleItemParamsSchema,
    body: controller.moveScheduleItemBodySchema,
  }),
  controller.moveScheduleItem,
);
