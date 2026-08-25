import { z } from 'zod';
import { IsoDate } from './common';

/** Public feed/search card (§6.10). Projected from the materialized Listing row. */
export const ListingSummary = z.object({
  id: z.string(),
  propertyId: z.string(),
  unitId: z.string().optional(),
  title: z.string(),
  area: z.string(),
  lga: z.string(),
  rent: z.number().int(),
  beds: z.number().int(),
  baths: z.number().int(),
  size: z.number(),
  type: z.string(),
  verified: z.boolean(),
  amenities: z.array(z.string()),
  landlordName: z.string(),
  /** Resolved first image for feed/search cards; the detail DTO still carries the full gallery. */
  imageUrl: z.string().optional(),
  listedAt: IsoDate.optional(),
  // personalized (only for authed tenants)
  saved: z.boolean().optional(),
  recommended: z.boolean().optional(),
  matchReason: z.string().optional(),
});
export type ListingSummary = z.infer<typeof ListingSummary>;

export const ListingDetail = ListingSummary.extend({
  description: z.string(),
  images: z.array(z.string()),
});
export type ListingDetail = z.infer<typeof ListingDetail>;

export const ListingFilters = z.object({
  area: z.string().optional(),
  maxPrice: z.coerce.number().int().optional(),
  beds: z.coerce.number().int().optional(),
  q: z.string().optional(),
});
export type ListingFilters = z.infer<typeof ListingFilters>;

export const ToggleListingInput = z.object({ listed: z.boolean() });
export type ToggleListingInput = z.infer<typeof ToggleListingInput>;

export const SearchInput = z.object({ query: z.string().min(1) });
export type SearchInput = z.infer<typeof SearchInput>;

export const ParsedSearchFilters = z.object({
  area: z.string().optional(),
  lga: z.string().optional(),
  minBeds: z.number().int().optional(),
  maxPrice: z.number().int().optional(),
  propertyType: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});
export type ParsedSearchFilters = z.infer<typeof ParsedSearchFilters>;

export const SearchResponse = z.object({
  filters: ParsedSearchFilters,
  results: z.array(ListingSummary),
  degraded: z.boolean().optional(),
});
export type SearchResponse = z.infer<typeof SearchResponse>;

export const PreferencesInput = z.object({
  budgetMin: z.number().int().optional(),
  budgetMax: z.number().int().optional(),
  areas: z.array(z.string()).optional(),
  sizeLabel: z.string().optional(),
  bedrooms: z.number().int().optional(),
});
export type PreferencesInput = z.infer<typeof PreferencesInput>;
