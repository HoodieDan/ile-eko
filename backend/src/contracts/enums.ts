import { z } from 'zod';

/** Canonical enums (from @ile-eko/core). */
export const PropertyType = z.enum([
  'self-contained',
  'mini-flat',
  'one-bedroom',
  'two-bedroom',
  'three-bedroom',
  'duplex',
  'shop',
  'office',
  'other',
]);
export type PropertyType = z.infer<typeof PropertyType>;

export const PaymentFrequency = z.enum(['monthly', 'quarterly', 'biannual', 'annual']);
export type PaymentFrequency = z.infer<typeof PaymentFrequency>;

/** Derived occupancy (never independently writable — comes from active leases). */
export const OccupancyStatus = z.enum(['vacant', 'occupied', 'partial']);
export type OccupancyStatus = z.infer<typeof OccupancyStatus>;

/** Date-independent settlement of a rent obligation. */
export const Settlement = z.enum(['unallocated', 'partial', 'paid']);
export type Settlement = z.infer<typeof Settlement>;

/** Display status combining settlement + query-time date component. */
export const ObligationStatus = z.enum(['upcoming', 'due', 'partial', 'paid', 'overdue']);
export type ObligationStatus = z.infer<typeof ObligationStatus>;

export const PaymentMethod = z.enum(['cash', 'transfer', 'card', 'other']);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const RiskBand = z.enum(['low', 'medium', 'high']);
export type RiskBand = z.infer<typeof RiskBand>;

/** Number of obligation periods per year for a frequency. */
export const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  biannual: 2,
  annual: 1,
};
