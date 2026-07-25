import { z } from 'zod';

/**
 * The shared capability vocabulary (§8). One enum drives route authorization,
 * navigation/button visibility, and audit — and is delivered to the frontend
 * via SessionDTO (global) and resource DTOs (scoped), never re-derived there.
 */
export const Capability = z.enum([
  // caretaker-grantable (per-property flags)
  'log_payment',
  'edit_tenant',
  'create_lease',
  'upload_images',
  'manage_units',
  'edit_property',
  // landlord-only (never a caretaker flag)
  'end_lease',
  'view_revenue',
  'toggle_listing',
  'delete_resource',
  'manage_team',
  'use_ai',
  // tenant
  'browse_listings',
  'enquire',
  'save_listing',
  'set_preferences',
]);
export type Capability = z.infer<typeof Capability>;

/** Per-property permission flags stored on a TeamMembership (§5.7). */
export const CaretakerPermissions = z.object({
  canLogPayments: z.boolean(),
  canEditTenants: z.boolean(),
  canUploadImages: z.boolean(),
  canManageUnits: z.boolean(),
  canEditProperty: z.boolean(),
});
export type CaretakerPermissions = z.infer<typeof CaretakerPermissions>;
