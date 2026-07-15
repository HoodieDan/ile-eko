import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { AppError } from '../../utils/AppError';
import { ChangePasswordInput, PreferencesInput } from '../../contracts';
import { presentUser } from '../../presenters/user';
import { globalCapabilities } from '../../rbac/capabilities';
import { requireRole } from '../../middleware/authorize';
import * as authService from '../auth/auth.service';

export const accountRouter: Router = Router();

accountRouter.use(authenticate);

/** Current profile + global capabilities (§6.14). */
accountRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized();
    res.status(200).json({
      user: presentUser(req.auth.user),
      capabilities: globalCapabilities(req.auth.role),
    });
  }),
);

/** Tenant search preferences — power recommendations (§6.14). */
accountRouter.get(
  '/preferences',
  requireRole('tenant'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized();
    res.json(req.auth.user.preferences ?? { areas: [] });
  }),
);

accountRouter.patch(
  '/preferences',
  requireRole('tenant'),
  validate(PreferencesInput),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized();
    req.auth.user.set('preferences', { areas: [], ...(req.auth.user.preferences ?? {}), ...req.body });
    await req.auth.user.save();
    res.json(req.auth.user.preferences);
  }),
);

/** Dedicated password change — requires current password, revokes other sessions (§6.1). */
accountRouter.post(
  '/change-password',
  validate(ChangePasswordInput),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized();
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;
    await authService.changePassword(
      req.auth.user,
      req.auth.sessionId,
      currentPassword,
      newPassword,
    );
    res.status(200).json({ ok: true });
  }),
);
