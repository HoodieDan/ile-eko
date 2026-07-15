import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { optionalAuth } from '../../middleware/optionalAuth';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimit';
import { ParsedSearchFilters, SearchInput, type SearchResponse } from '../../contracts';
import { getEngine, AIUnavailableError } from '../../ai/engine';
import { withRetry } from '../../ai/retry';
import { parseQueryHeuristic } from './search.service';
import { listListings } from '../listings/listings.service';

export const searchRouter: Router = Router();

// Public NL search (browse-first). AI parse in front; deterministic heuristic fallback (§7.5).
searchRouter.post(
  '/',
  authLimiter,
  optionalAuth,
  validate(SearchInput),
  asyncHandler(async (req, res) => {
    let filters = parseQueryHeuristic(req.body.query);
    let degraded = false;

    if (process.env.AI_API_KEY) {
      try {
        filters = await withRetry(() =>
          getEngine().generateObject({
            schema: ParsedSearchFilters,
            system:
              'Extract structured property-search filters from the query. Return only fields that are explicitly stated; omit the rest. Prices are integer Naira.',
            prompt: req.body.query,
          }),
        );
      } catch (err) {
        if (!(err instanceof AIUnavailableError)) throw err;
        degraded = true; // fall back to the heuristic parse
      }
    } else {
      degraded = true;
    }

    const tenantId = req.auth?.role === 'tenant' ? req.auth.userId : undefined;
    const results = await listListings(filters, tenantId);
    const body: SearchResponse = { filters, results, ...(degraded ? { degraded } : {}) };
    res.json(body);
  }),
);
