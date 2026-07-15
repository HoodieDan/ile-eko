import { Router } from 'express';
import type { Request } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { optionalAuth } from '../../middleware/optionalAuth';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ToggleListingInput } from '../../contracts';
import * as svc from './listings.service';

export const listingsRouter: Router = Router();

function viewerKey(req: Request): string {
  return req.auth?.userId ?? (req.get('x-session-id') || req.ip || 'anon');
}

// Public browse (browse-first, §6.10). Personalized if a tenant token is present.
listingsRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.auth?.role === 'tenant' ? req.auth.userId : undefined;
    const items = await svc.listListings(
      {
        area: req.query.area as string | undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        beds: req.query.beds ? Number(req.query.beds) : undefined,
        q: req.query.q as string | undefined,
      },
      tenantId,
    );
    res.json({ items, total: items.length });
  }),
);

// Landlord toggles listing on/off for a target — landlord-only.
listingsRouter.patch(
  '/:id',
  authenticate,
  requireRole('landlord', 'admin'),
  validate(ToggleListingInput),
  asyncHandler(async (req, res) => {
    res.json(await svc.toggleListing(req.auth!.userId, req.params.id as string, req.body.listed));
  }),
);

listingsRouter.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.auth?.role === 'tenant' ? req.auth.userId : undefined;
    res.json(await svc.getListing(req.params.id as string, tenantId));
  }),
);

// Pure view recorder (no GET side effects) — public, deduped.
listingsRouter.post(
  '/:id/view',
  optionalAuth,
  asyncHandler(async (req, res) => {
    await svc.recordView(req.params.id as string, viewerKey(req), req.auth?.userId);
    res.json({ ok: true });
  }),
);
