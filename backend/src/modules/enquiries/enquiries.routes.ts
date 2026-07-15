import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { idempotent } from '../../middleware/idempotency';
import { actorFrom } from '../../utils/http';
import { CreateEnquiryInput, ReplyInput } from '../../contracts';
import * as svc from './enquiries.service';

export const enquiriesRouter: Router = Router();
enquiriesRouter.use(authenticate);

// --- Tenant side (literal routes before /:id) ---
enquiriesRouter.post(
  '/',
  requireRole('tenant'),
  validate(CreateEnquiryInput),
  idempotent('enquiry.create'),
  asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createEnquiry(req.auth!.userId, req.body));
  }),
);

enquiriesRouter.get(
  '/mine',
  requireRole('tenant'),
  asyncHandler(async (req, res) => {
    const items = await svc.listMine(req.auth!.userId);
    res.json({ items, total: items.length });
  }),
);

// --- Landlord inbox ---
enquiriesRouter.get(
  '/',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    const { items, unreadCount } = await svc.listInbox(req.auth!.userId);
    res.json({ items, total: items.length, unreadCount });
  }),
);

enquiriesRouter.get(
  '/:id',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    res.json(await svc.getThread(req.auth!.userId, req.params.id as string));
  }),
);

enquiriesRouter.post(
  '/:id/replies',
  requireRole('landlord', 'admin'),
  validate(ReplyInput),
  asyncHandler(async (req, res) => {
    await svc.reply(req.auth!.userId, actorFrom(req), req.params.id as string, req.body.body);
    res.status(201).json({ ok: true });
  }),
);

enquiriesRouter.patch(
  '/:id/read',
  requireRole('landlord', 'admin'),
  asyncHandler(async (req, res) => {
    await svc.markRead(req.auth!.userId, req.params.id as string);
    res.json({ ok: true });
  }),
);
