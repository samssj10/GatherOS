import { Router } from 'express';
import { attendeeRouter } from './attendeeRoutes';
import { scheduleRouter } from './scheduleRoutes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
apiRouter.use('/attendees', attendeeRouter);
apiRouter.use('/schedule', scheduleRouter);
