import type { Capability, Role } from '../contracts';

/**
 * Global capability resolution (§8). One source of truth for what a role can do
 * account-wide; resource-scoped capabilities (per-property caretaker flags) are
 * resolved separately against a TeamMembership when those modules land (M2/M3).
 *
 * This result is delivered to the frontend in SessionDTO so the app drives
 * tab/button visibility from the same booleans the API enforces — it never
 * re-implements role logic.
 */
const GLOBAL_CAPABILITIES: Record<Role, Capability[]> = {
  landlord: [
    'log_payment',
    'edit_tenant',
    'create_lease',
    'upload_images',
    'manage_units',
    'edit_property',
    'end_lease',
    'view_revenue',
    'toggle_listing',
    'delete_resource',
    'manage_team',
    'use_ai',
  ],
  // Caretaker global set is intentionally empty here: caretaker abilities are
  // per-property (resolved against TeamMembership), never account-global.
  caretaker: [],
  tenant: ['browse_listings', 'enquire', 'save_listing', 'set_preferences'],
  // Admin is superuser for the minimal admin surface (§6.18).
  admin: [
    'log_payment',
    'edit_tenant',
    'create_lease',
    'upload_images',
    'manage_units',
    'edit_property',
    'end_lease',
    'view_revenue',
    'toggle_listing',
    'delete_resource',
    'manage_team',
    'use_ai',
  ],
};

export function globalCapabilities(role: Role): Capability[] {
  return GLOBAL_CAPABILITIES[role] ?? [];
}

export function hasGlobalCapability(role: Role, cap: Capability): boolean {
  return globalCapabilities(role).includes(cap);
}
