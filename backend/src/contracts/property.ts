import { z } from 'zod';
import { IsoDate } from './common';
import { OccupancyStatus, PaymentFrequency, PropertyType } from './enums';
import { Capability } from './capability';

export const PropertyDTO = z.object({
  id: z.string(),
  landlordId: z.string(),
  propertyTitle: z.string(),
  address: z.string(),
  area: z.string(),
  lga: z.string(),
  propertyType: PropertyType,
  description: z.string(),
  images: z.array(z.string()),
  hasUnits: z.boolean(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  sizeSqm: z.number().nonnegative().optional(),
  amenities: z.array(z.string()),
  paymentFrequency: PaymentFrequency,
  rentAmount: z.number().int().nonnegative().optional(),
  verified: z.boolean(),
  status: OccupancyStatus, // DERIVED from active leases
  unitCount: z.number().int().nonnegative(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type PropertyDTO = z.infer<typeof PropertyDTO>;

/** Property detail adds resource-scoped capabilities the caller has here (§8). */
export const PropertyDetailDTO = PropertyDTO.extend({
  capabilities: z.array(Capability),
});
export type PropertyDetailDTO = z.infer<typeof PropertyDetailDTO>;

export const CreatePropertyInput = z.object({
  propertyTitle: z.string().min(1),
  address: z.string().min(1),
  area: z.string().min(1),
  lga: z.string().min(1),
  propertyType: PropertyType,
  description: z.string().default(''),
  images: z.array(z.string()).default([]),
  hasUnits: z.boolean().default(false),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  sizeSqm: z.number().nonnegative().optional(),
  amenities: z.array(z.string()).default([]),
  paymentFrequency: PaymentFrequency.default('annual'),
  rentAmount: z.number().int().nonnegative().optional(),
});
export type CreatePropertyInput = z.infer<typeof CreatePropertyInput>;

export const UpdatePropertyInput = CreatePropertyInput.partial();
export type UpdatePropertyInput = z.infer<typeof UpdatePropertyInput>;

export const PropertyStats = z.object({
  all: z.number().int(),
  occupied: z.number().int(),
  vacant: z.number().int(),
  partial: z.number().int(),
});
export type PropertyStats = z.infer<typeof PropertyStats>;

// --- Units ---
export const UnitDTO = z.object({
  id: z.string(),
  propertyId: z.string(),
  label: z.string(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  floor: z.number().int().optional(),
  sizeSqm: z.number().nonnegative().optional(),
  rentAmount: z.number().int().nonnegative(),
  paymentFrequency: PaymentFrequency,
  amenities: z.array(z.string()),
  images: z.array(z.string()),
  status: OccupancyStatus, // DERIVED
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type UnitDTO = z.infer<typeof UnitDTO>;

export const CreateUnitInput = z.object({
  label: z.string().min(1),
  bedrooms: z.number().int().nonnegative().default(1),
  bathrooms: z.number().int().nonnegative().default(1),
  floor: z.number().int().optional(),
  sizeSqm: z.number().nonnegative().optional(),
  rentAmount: z.number().int().nonnegative(),
  paymentFrequency: PaymentFrequency.default('annual'),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});
export type CreateUnitInput = z.infer<typeof CreateUnitInput>;

export const UpdateUnitInput = CreateUnitInput.partial();
export type UpdateUnitInput = z.infer<typeof UpdateUnitInput>;
