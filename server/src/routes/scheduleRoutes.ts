import { Router } from 'express';
import * as controller from '../controllers/scheduleController';

export const scheduleRouter = Router();

scheduleRouter.get('/', controller.listSchedule);
scheduleRouter.get('/budget', controller.getBudgetSummary);
