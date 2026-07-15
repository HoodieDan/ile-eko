import { z } from 'zod';
import { IsoDate } from './common';
import { ObligationStatus, PaymentFrequency, PaymentMethod, Settlement } from './enums';

// --- Lease ---
export const LeaseDTO = z.object({
  id: z.string(),
  tenantId: z.string(),
  propertyId: z.string(),
  unitId: z.string().optional(),
  startDate: z.string(), // date-only
  endDate: z.string(),
  billingAmount: z.number().int().nonnegative(), // per obligation
  annualizedRent: z.number().int().nonnegative(),
  schedule: PaymentFrequency,
  status: z.enum(['active', 'ended', 'renewed']),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type LeaseDTO = z.infer<typeof LeaseDTO>;

export const CreateLeaseInput = z.object({
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  startDate: z.string(), // 'YYYY-MM-DD'
  endDate: z.string(),
  billingAmount: z.number().int().positive(),
  schedule: PaymentFrequency,
});
export type CreateLeaseInput = z.infer<typeof CreateLeaseInput>;

// --- RentObligation ---
export const RentObligationDTO = z.object({
  id: z.string(),
  leaseId: z.string(),
  tenantId: z.string(),
  propertyId: z.string(),
  unitId: z.string().optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
  dueDate: z.string(),
  amountDue: z.number().int().nonnegative(),
  amountAllocated: z.number().int().nonnegative(),
  settlement: Settlement,
  status: ObligationStatus, // settlement + query-time date component
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type RentObligationDTO = z.infer<typeof RentObligationDTO>;

// --- Payment ---
export const PaymentDTO = z.object({
  id: z.string(),
  tenantId: z.string(),
  leaseId: z.string(),
  amount: z.number().int(),
  paidAt: IsoDate,
  method: PaymentMethod,
  methodDetail: z.string().optional(),
  periodCovered: z.string().optional(),
  receiptKey: z.string().optional(),
  reversalOfPaymentId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: IsoDate,
});
export type PaymentDTO = z.infer<typeof PaymentDTO>;

export const LogPaymentInput = z.object({
  leaseId: z.string().min(1),
  amount: z.number().int().positive(),
  paidAt: z.string().optional(), // ISO instant; defaults to now
  method: PaymentMethod.default('transfer'),
  methodDetail: z.string().optional(),
  periodCovered: z.string().optional(),
  receiptKey: z.string().optional(),
  notes: z.string().optional(),
  // optional explicit allocation; default = oldest-due-first
  allocateTo: z.array(z.object({ obligationId: z.string(), amount: z.number().int().positive() })).optional(),
});
export type LogPaymentInput = z.infer<typeof LogPaymentInput>;
