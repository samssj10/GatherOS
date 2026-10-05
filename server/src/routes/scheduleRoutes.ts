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
// The rotating code shown on the room screen. Planner only.
scheduleRouter.get(
  '/:id/checkin-code',
  requireRole('planner'),
  validate({ params: controller.sessionParamsSchema }),
  controller.getCheckInCode,
);

// Planner-only edits: save a whole itinerary (e.g. an accepted AI draft) or reorder a day.
scheduleRouter.put(
  '/',
  requireRole('planner'),
  validate({ body: controller.replaceScheduleBodySchema }),
  controller.replaceSchedule,
);
// Put sessions back on the days and times they had: the exact undo for a move.
scheduleRouter.put(
  '/timing',
  requireRole('planner'),
  validate({ body: controller.restoreTimingBodySchema }),
  controller.restoreTiming,
);
// Reorder one day (also how a session is moved onto it); the server re-times that day.
scheduleRouter.put(
  '/days/:day/order',
  requireRole('planner'),
  validate({
    params: controller.reorderDayParamsSchema,
    body: controller.reorderDayBodySchema,
  }),
  controller.reorderDay,
);
