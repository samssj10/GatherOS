import path from 'node:path';
import { createApp } from './app';
import { env } from './utils/env';
import { logger } from './utils/logger';

// server/src and server/dist both sit one level under server/, so the built client is the same distance away.
const clientDir = env.SERVE_CLIENT ? path.resolve(__dirname, '../../client/dist') : null;

const app = createApp({
  clientDir,
  trustProxyHops: env.TRUST_PROXY_HOPS,
  logClientAddress: env.LOG_CLIENT_ADDRESS,
});

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, servingClient: clientDir !== null, trustProxyHops: env.TRUST_PROXY_HOPS }, 'BFF listening');
});
