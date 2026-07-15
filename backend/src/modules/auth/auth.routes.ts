import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimit';
import { LoginInput, RegisterInput, RegisterPushInput } from '../../contracts';
import * as ctrl from './auth.controller';

export const authRouter: Router = Router();

// Public (rate-limited)
authRouter.post('/register', authLimiter, validate(RegisterInput), asyncHandler(ctrl.register));
authRouter.post('/login', authLimiter, validate(LoginInput), asyncHandler(ctrl.login));

// Authenticated
authRouter.get('/session', authenticate, asyncHandler(ctrl.session));
authRouter.post('/logout', authenticate, asyncHandler(ctrl.logout));
authRouter.get('/sessions', authenticate, asyncHandler(ctrl.listSessions));
authRouter.post('/sessions/:id/revoke', authenticate, asyncHandler(ctrl.revokeSession));
authRouter.post(
  '/register-push',
  authenticate,
  validate(RegisterPushInput),
  asyncHandler(ctrl.registerPush),
);
