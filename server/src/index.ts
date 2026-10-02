import express from 'express';
import helmet from 'helmet';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import { apiRouter } from './routes';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);
app.use('/api', apiLimiter, apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'BFF listening');
});
