import { Router } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { AppError } from '../../utils/AppError';
import { Listing, SavedListing } from '../../models';
import { toSummary } from '../listings/listings.service';

export const savedRouter: Router = Router();
savedRouter.use(authenticate, requireRole('tenant'));

savedRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const saved = await SavedListing.find({ tenantUserId: req.auth!.userId }).sort({ createdAt: -1 }).lean();
    const listings = await Listing.find({ _id: { $in: saved.map((s) => s.listingId) } });
    const items = listings.map((l) => ({ ...toSummary(l), saved: true }));
    res.json({ items, total: items.length });
  }),
);

savedRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const listingId = String(req.body?.listingId ?? '');
    if (!Types.ObjectId.isValid(listingId)) throw AppError.badRequest('Invalid listingId');
    if (!(await Listing.findById(listingId).lean())) throw AppError.notFound('Listing not found');
    await SavedListing.updateOne(
      { tenantUserId: req.auth!.userId, listingId },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    res.status(201).json({ ok: true });
  }),
);

savedRouter.delete(
  '/:listingId',
  asyncHandler(async (req, res) => {
    await SavedListing.deleteOne({ tenantUserId: req.auth!.userId, listingId: req.params.listingId });
    res.json({ ok: true });
  }),
);
