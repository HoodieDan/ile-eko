import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { dailySweep } from '../../services/reminders';
import { drainOutbox } from '../../worker/outbox';

/**
 * Internal endpoints for Cloud Scheduler / Cloud Tasks (§13). In production these
 * are OIDC-authenticated; here we gate on a shared secret (TASKS_TOKEN) so they
 * are never publicly callable. OIDC verification is wired at deploy time.
 */
function tasksAuth(req: Request, _res: Response, next: NextFunction): void {
  const expected = process.env.TASKS_TOKEN;
  if (!expected) throw AppError.forbidden('Tasks endpoint disabled (no TASKS_TOKEN configured)');
  const provided = req.get('x-tasks-token');
  if (provided !== expected) throw AppError.unauthorized('Invalid tasks token');
  next();
}

export const tasksRouter: Router = Router();
tasksRouter.use(tasksAuth);

tasksRouter.post(
  '/daily-sweep',
  asyncHandler(async (_req, res) => {
    res.json(await dailySweep());
  }),
);

tasksRouter.post(
  '/outbox',
  asyncHandler(async (_req, res) => {
    const processed = await drainOutbox();
    res.json({ processed });
  }),
);
