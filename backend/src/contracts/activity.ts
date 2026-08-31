import { z } from 'zod';
import { IsoDate } from './common';

export const ActivityAction = z.enum([
  'property.created',
  'property.updated',
  'property.archived',
  'unit.created',
  'unit.updated',
  'tenant.added',
  'tenant.updated',
  'tenant.evicted',
  'lease.created',
  'lease.ended',
  'payment.logged',
  'payment.reversed',
  'team.invited',
  'team.joined',
  'team.removed',
  'enquiry.received',
  'enquiry.replied',
  'listing.updated',
]);
export type ActivityAction = z.infer<typeof ActivityAction>;

export const ActivityCategory = z.enum([
  'payment',
  'tenant',
  'property',
  'unit',
  'lease',
  'team',
  'enquiry',
  'image',
  'status',
  'maintenance',
]);
export type ActivityCategory = z.infer<typeof ActivityCategory>;

export const ActivityLogDTO = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: ActivityAction,
  category: ActivityCategory,
  propertyId: z.string().optional(),
  entityId: z.string().optional(),
  description: z.string(),
  flag: z.string().optional(),
  createdAt: IsoDate,
});
export type ActivityLogDTO = z.infer<typeof ActivityLogDTO>;

/** Deterministic action → category (§5.8): complete over the action set. */
export function categoryFor(action: ActivityAction): ActivityCategory {
  const head = action.split('.')[0];
  switch (head) {
    case 'payment':
      return 'payment';
    case 'tenant':
      return 'tenant';
    case 'property':
      return 'property';
    case 'unit':
      return 'unit';
    case 'lease':
      return 'lease';
    case 'team':
      return 'team';
    case 'enquiry':
      return 'enquiry';
    case 'listing':
      return 'status';
    default:
      return 'status';
  }
}
