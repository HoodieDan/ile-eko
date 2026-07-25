import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { optionalAuth } from '../../middleware/optionalAuth';
import { User } from '../../models';
import { listListings } from '../listings/listings.service';
import type { ParsedSearchFilters } from '../../contracts';

export const recommendationsRouter: Router = Router();

/**
 * Property matching (§7.6). M4: pre-filter by the tenant's preferences (cold-start
 * = newest vacant). M5 adds LLM ranking + matchReason on top of this candidate set.
 */
recommendationsRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.auth?.role === 'tenant' ? req.auth.userId : undefined;
    const filters: ParsedSearchFilters = {};

    if (tenantId) {
      const user = await User.findById(tenantId).lean();
      const prefs = user?.preferences;
      if (prefs) {
        if (prefs.budgetMax) filters.maxPrice = prefs.budgetMax;
        if (prefs.bedrooms) filters.minBeds = prefs.bedrooms;
        if (prefs.areas?.length) filters.area = prefs.areas[0];
      }
    }

    const items = (await listListings(filters, tenantId)).map((l) => ({ ...l, recommended: true }));
    res.json({ items, total: items.length, degraded: true }); // AI ranking lands in M5
  }),
);
