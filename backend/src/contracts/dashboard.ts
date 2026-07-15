import { z } from 'zod';
import { ActivityLogDTO } from './activity';

/** Field names mirror the landlord dashboard screen's `summary` object (§6.9). */
export const DashboardSummaryNumbers = z.object({
  collected: z.number().int(),
  rollAnnual: z.number().int(),
  overdueAmt: z.number().int(),
  dueAmt: z.number().int(),
  vacantAmt: z.number().int(),
  occupied: z.number().int(),
  total: z.number().int(),
  occupancyPct: z.number(),
  collectedPct: z.number(),
});
export type DashboardSummaryNumbers = z.infer<typeof DashboardSummaryNumbers>;

export const UpcomingRentItem = z.object({
  tenantId: z.string(),
  tenantName: z.string(),
  propertyId: z.string(),
  propertyTitle: z.string(),
  dueDate: z.string(),
  amount: z.number().int(),
  status: z.enum(['overdue', 'due', 'upcoming']),
  daysToDue: z.number().int(),
});
export type UpcomingRentItem = z.infer<typeof UpcomingRentItem>;

export const DashboardSummary = z.object({
  summary: DashboardSummaryNumbers,
  upcoming: z.array(UpcomingRentItem),
  enquiriesUnread: z.number().int(),
  activity: z.array(ActivityLogDTO),
});
export type DashboardSummary = z.infer<typeof DashboardSummary>;
