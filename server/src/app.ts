import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import { apiRouter } from './routes';

export interface AppOptions {
  /**
   * Folder holding the built React app (`client/dist`). When it contains an index.html the server
   * serves it too, so one process and one origin can host both the app and the API.
   */
  clientDir?: string | null;
  /** How many proxies sit in front of the server (a host's load balancer counts as one). 0 trusts none. */
  trustProxyHops?: number;
}

// Any GET that is not under /api and has no file extension is a page of the single-page app.
const APP_PAGE = /^\/(?!api(?:\/|$))[^.]*$/;

/** Builds the Express app without starting it, so tests can run it on any free port. */
export function createApp({ clientDir = null, trustProxyHops = 0 }: AppOptions = {}): Express {
  const app = express();

  // Behind a host's proxy every request arrives from the proxy's address; without this the rate limits
  // would treat all visitors as one.
  app.set('trust proxy', trustProxyHops);

  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use('/api', apiLimiter, apiRouter);

  const indexFile = clientDir ? path.join(clientDir, 'index.html') : null;
  if (clientDir && indexFile && fs.existsSync(indexFile)) {
    // Built files carry a content hash in their name, so they can be cached for good.
    app.use('/assets', express.static(path.join(clientDir, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(clientDir, { index: false, maxAge: '1h' }));
    app.get(APP_PAGE, (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(indexFile);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
