import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimit';
import { ChatInput } from '../../contracts';
import * as svc from './ai.service';

// AI assistant is landlord-only (§6.17).
export const aiRouter: Router = Router();
aiRouter.use(authenticate, requireRole('landlord', 'admin'));

aiRouter.post(
  '/chat',
  authLimiter,
  validate(ChatInput),
  asyncHandler(async (req, res) => {
    res.json(await svc.chat(req.auth!.userId, req.body.message, req.body.conversationId));
  }),
);

aiRouter.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const items = await svc.listConversations(req.auth!.userId);
    res.json({ items, total: items.length });
  }),
);

aiRouter.get(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    res.json(await svc.getConversation(req.auth!.userId, req.params.id as string));
  }),
);

aiRouter.get(
  '/briefing',
  asyncHandler(async (req, res) => {
    res.json(await svc.briefing(req.auth!.userId));
  }),
);

aiRouter.get(
  '/briefs',
  asyncHandler(async (req, res) => {
    const items = await svc.briefs(req.auth!.userId);
    res.json({ items, total: items.length });
  }),
);
