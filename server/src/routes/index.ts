import { Router } from 'express';
import { aiRouter } from './aiRoutes';
import { attendeeRouter } from './attendeeRoutes';
import { authRouter } from './authRoutes';
import { scheduleRouter } from './scheduleRoutes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
apiRouter.use('/auth', authRouter);
apiRouter.use('/attendees', attendeeRouter);
apiRouter.use('/schedule', scheduleRouter);
apiRouter.use('/ai', aiRouter);
