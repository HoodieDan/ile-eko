export type ActivityAction =
  | 'property.created'
  | 'property.updated'
  | 'tenant.added'
  | 'tenant.updated'
  | 'payment.logged'
  | 'payment.confirmed'
  | 'unit.vacated'
  | 'unit.occupied'
  | 'team.invited'
  | 'team.removed'
  | 'enquiry.received'
  | 'enquiry.replied';

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  propertyId?: string;
  entityId?: string;
  description: string;
  createdAt: string;
}
