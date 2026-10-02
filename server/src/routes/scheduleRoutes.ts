import { Router } from 'express';
import * as controller from '../controllers/scheduleController';
import { requireAuth, requireRole } from '../middlewares/auth';

export const scheduleRouter = Router();

scheduleRouter.use(requireAuth);

// Attendee-shaped payload (AttendeeScheduleDTO) available to any signed-in user.
scheduleRouter.get('/me', controller.listMySchedule);
scheduleRouter.get('/', requireRole('planner'), controller.listSchedule);
scheduleRouter.get('/budget', requireRole('planner'), controller.getBudgetSummary);
