import { z } from 'zod';
import { IsoDate } from './common';
import { PaymentFrequency, RiskBand } from './enums';

export const TenantRisk = z.object({
  band: RiskBand,
  score: z.number().min(0).max(1),
  reason: z.string(),
  scoringVersion: z.string(),
});
export type TenantRisk = z.infer<typeof TenantRisk>;

/** Tenant identity + composed lease facts + cached risk (§5.4). */
export const TenantDTO = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  notes: z.string().optional(),
  // composed from the current lease (null if none)
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  leaseId: z.string().optional(),
  rentAmount: z.number().int().nonnegative().optional(),
  paymentSchedule: PaymentFrequency.optional(),
  leaseStartDate: z.string().optional(),
  leaseEndDate: z.string().optional(),
  paymentDueDate: z.string().optional(),
  status: z.enum(['up-to-date', 'due', 'overdue', 'partial', 'no-lease']),
  risk: TenantRisk.optional(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type TenantDTO = z.infer<typeof TenantDTO>;

export const CreateTenantInput = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});
export type CreateTenantInput = z.infer<typeof CreateTenantInput>;

export const UpdateTenantInput = CreateTenantInput.partial();
export type UpdateTenantInput = z.infer<typeof UpdateTenantInput>;
