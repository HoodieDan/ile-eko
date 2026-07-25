import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { landlordScope } from '../../utils/http';
import { ActivityLog } from '../../models';
import { summaryNumbers, upcomingRent } from '../../services/stats';
import { unreadCount } from '../enquiries/enquiries.service';
import { presentActivity } from '../../presenters/entities';
import type { DashboardSummary } from '../../contracts';

export const dashboardRouter: Router = Router();
dashboardRouter.use(authenticate, requireRole('landlord', 'admin'));

dashboardRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const landlordId = landlordScope(req);
    const [summary, upcoming, activityDocs, enquiriesUnread] = await Promise.all([
      summaryNumbers(landlordId),
      upcomingRent(landlordId, 5),
      ActivityLog.find({ landlordId }).sort({ createdAt: -1 }).limit(5),
      unreadCount(landlordId),
    ]);
    const body: DashboardSummary = {
      summary,
      upcoming,
      enquiriesUnread,
      activity: activityDocs.map(presentActivity),
    };
    res.json(body);
  }),
);
