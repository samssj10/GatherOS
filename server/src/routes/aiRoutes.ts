import { Router } from 'express';
import * as controller from '../controllers/aiController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { aiLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';

export const aiRouter = Router();

// Order matters: reject unauthenticated callers before they consume rate-limit budget.
aiRouter.post(
  '/generate-schedule',
  requireAuth,
  requireRole('planner'),
  aiLimiter,
  validate({ body: controller.generateScheduleBodySchema }),
  controller.generateSchedule,
);
