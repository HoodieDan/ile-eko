import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { landlordScope } from '../../utils/http';
import { ActivityLog } from '../../models';
import { presentActivity } from '../../presenters/entities';

export const activityRouter: Router = Router();
activityRouter.use(authenticate, requireRole('landlord', 'admin'));

activityRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = { landlordId: landlordScope(req) };
    if (req.query.category) query.category = req.query.category;
    if (req.query.actorId) query.actorId = req.query.actorId;
    if (req.query.propertyId) query.propertyId = req.query.propertyId;
    if (req.query.from || req.query.to) {
      const range: Record<string, Date> = {};
      if (req.query.from) range.$gte = new Date(req.query.from as string);
      if (req.query.to) range.$lte = new Date(req.query.to as string);
      query.createdAt = range;
    }
    const docs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ items: docs.map(presentActivity), total: docs.length });
  }),
);
