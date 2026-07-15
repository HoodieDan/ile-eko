import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { Notification, type NotificationDoc } from '../../models';
import type { NotificationDTO } from '../../contracts';

function present(n: NotificationDoc): NotificationDTO {
  return {
    id: n.id,
    type: n.type as NotificationDTO['type'],
    title: n.title,
    body: n.body,
    ...(n.deepLink ? { deepLink: n.deepLink } : {}),
    ...(n.propertyId ? { propertyId: String(n.propertyId) } : {}),
    read: n.read,
    createdAt: (n.createdAt as Date).toISOString(),
  };
}

export const notificationsRouter: Router = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const docs = await Notification.find({ userId: req.auth!.userId }).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ userId: req.auth!.userId, read: false });
    res.json({ items: docs.map(present), total: docs.length, unreadCount });
  }),
);

notificationsRouter.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await Notification.updateOne({ _id: req.params.id, userId: req.auth!.userId }, { $set: { read: true } });
    res.json({ ok: true });
  }),
);

notificationsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ userId: req.auth!.userId, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  }),
);
