import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

/**
 * The Express app, without a port — `server.js` owns the lifecycle and tests
 * mount it on an ephemeral port.
 *
 * Middleware order: CORS → JSON body → /api routes → 404 → central error
 * handler. CORS is open (`*` by default) because auth is bearer-token, not
 * cookies; tighten CORS_ORIGIN to a comma-separated list of origins if you
 * prefer explicit origins.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Key'],
      methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
