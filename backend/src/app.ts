import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { generalLimiter } from './middleware/rateLimit';
import { notFound, errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { accountRouter } from './modules/account/account.routes';
import { propertiesRouter } from './modules/properties/properties.routes';
import { propertyUnitsRouter, unitsRouter } from './modules/units/units.routes';
import { tenantsRouter } from './modules/tenants/tenants.routes';
import { leasesRouter } from './modules/leases/leases.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { activityRouter } from './modules/activity/activity.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';

/**
 * Build the Express app (no listen — testable). API is versioned under /v1 (§6);
 * /health sits at the root for Cloud Run probes.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));
  app.use(generalLimiter);

  // Health (root) — startup + liveness probe.
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Versioned API.
  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/account', accountRouter);
  v1.use('/properties/:id/units', propertyUnitsRouter);
  v1.use('/properties', propertiesRouter);
  v1.use('/units', unitsRouter);
  v1.use('/tenants', tenantsRouter);
  v1.use('/leases', leasesRouter);
  v1.use('/payments', paymentsRouter);
  v1.use('/dashboard', dashboardRouter);
  v1.use('/activity', activityRouter);
  v1.use('/uploads', uploadsRouter);
  app.use('/v1', v1);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
