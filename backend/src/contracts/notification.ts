import { z } from 'zod';
import { IsoDate } from './common';

export const NotificationDTO = z.object({
  id: z.string(),
  type: z.enum(['overdue', 'activity', 'ai', 'rent-due', 'lease']),
  title: z.string(),
  body: z.string(),
  deepLink: z.string().optional(),
  propertyId: z.string().optional(),
  read: z.boolean(),
  createdAt: IsoDate,
});
export type NotificationDTO = z.infer<typeof NotificationDTO>;
