import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { optionalAuth } from '../../middleware/optionalAuth';
import { validate } from '../../middleware/validate';
import { SearchInput, type SearchResponse } from '../../contracts';
import { parseQueryHeuristic } from './search.service';
import { listListings } from '../listings/listings.service';

export const searchRouter: Router = Router();

// Public NL search (browse-first). AI parse is layered in front in M5.
searchRouter.post(
  '/',
  optionalAuth,
  validate(SearchInput),
  asyncHandler(async (req, res) => {
    const filters = parseQueryHeuristic(req.body.query);
    const tenantId = req.auth?.role === 'tenant' ? req.auth.userId : undefined;
    const results = await listListings(filters, tenantId);
    const body: SearchResponse = { filters, results };
    res.json(body);
  }),
);
