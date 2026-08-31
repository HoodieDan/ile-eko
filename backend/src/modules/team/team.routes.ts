import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { idempotent } from '../../middleware/idempotency';
import { authLimiter } from '../../middleware/rateLimit';
import { actorFrom, landlordScope } from '../../utils/http';
import { AcceptInviteInput, InviteInput, UpdateCaretakerInput } from '../../contracts';
import * as svc from './team.service';

export const teamRouter: Router = Router();

// Public: accept an invitation (token-authenticated, rate-limited).
teamRouter.post(
  '/accept',
  authLimiter,
  validate(AcceptInviteInput),
  asyncHandler(async (req, res) => {
    res.status(201).json(await svc.accept(req.body));
  }),
);

// Landlord-only management (§8: team management never a caretaker capability).
teamRouter.use(authenticate, requireRole('landlord', 'admin'));

teamRouter.get(
  '/caretakers',
  asyncHandler(async (req, res) => {
    const items = await svc.listCaretakers(landlordScope(req));
    res.json({ items, total: items.length });
  }),
);

teamRouter.get(
  '/caretakers/:id',
  asyncHandler(async (req, res) => {
    const items = await svc.getCaretaker(landlordScope(req), req.params.id as string);
    res.json({ items, total: items.length });
  }),
);

teamRouter.post(
  '/invite',
  validate(InviteInput),
  idempotent('team.invite'),
  asyncHandler(async (req, res) => {
    res.status(201).json(await svc.invite(landlordScope(req), actorFrom(req), req.body));
  }),
);

teamRouter.post(
  '/invite/:id/resend',
  asyncHandler(async (req, res) => {
    res.json(await svc.resend(landlordScope(req), req.params.id as string));
  }),
);

teamRouter.patch(
  '/caretakers/:id',
  validate(UpdateCaretakerInput),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.updateCaretaker(
        landlordScope(req),
        actorFrom(req),
        req.params.id as string,
        req.body,
      ),
    );
  }),
);

teamRouter.post(
  '/caretakers/:id/revoke',
  asyncHandler(async (req, res) => {
    const items = await svc.revokeCaretaker(
      landlordScope(req),
      actorFrom(req),
      req.params.id as string,
    );
    res.json({ items, total: items.length });
  }),
);
