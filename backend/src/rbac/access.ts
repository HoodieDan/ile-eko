import { TeamMembership } from '../models';
import type { Role } from '../contracts';

export type CaretakerPermKey =
  | 'canLogPayments'
  | 'canEditTenants'
  | 'canUploadImages'
  | 'canManageUnits'
  | 'canEditProperty';

export interface OrgContext {
  /** The landlord org whose data is being acted on. */
  landlordId: string;
  isCaretaker: boolean;
  /** Property ids in scope; null = all (landlord/admin). */
  propertyIds: string[] | null;
  /** Per-property caretaker permissions (empty for landlord). */
  permsByProperty: Map<string, Record<CaretakerPermKey, boolean>>;
}

/**
 * Resolve the acting org for a user (§8). A landlord/admin owns their data
 * (all properties). A caretaker acts within one landlord's org, scoped to their
 * assigned properties with per-property permission flags.
 */
export async function resolveOrg(userId: string, role: Role): Promise<OrgContext> {
  if (role === 'landlord' || role === 'admin') {
    return { landlordId: userId, isCaretaker: false, propertyIds: null, permsByProperty: new Map() };
  }
  // caretaker (or tenant with no org)
  const memberships = await TeamMembership.find({ caretakerId: userId, status: 'active' }).lean();
  const perms = new Map<string, Record<CaretakerPermKey, boolean>>();
  const propertyIds: string[] = [];
  let landlordId = userId;
  for (const m of memberships) {
    landlordId = String(m.landlordId);
    const pid = String(m.propertyId);
    propertyIds.push(pid);
    perms.set(pid, {
      canLogPayments: Boolean(m.canLogPayments),
      canEditTenants: Boolean(m.canEditTenants),
      canUploadImages: Boolean(m.canUploadImages),
      canManageUnits: Boolean(m.canManageUnits),
      canEditProperty: Boolean(m.canEditProperty),
    });
  }
  return { landlordId, isCaretaker: true, propertyIds, permsByProperty: perms };
}

export function inScope(org: OrgContext, propertyId: string): boolean {
  return org.propertyIds === null || org.propertyIds.includes(propertyId);
}

export function propertyPermission(org: OrgContext, propertyId: string, cap: CaretakerPermKey): boolean {
  if (!org.isCaretaker) return true; // landlord/admin
  return Boolean(org.permsByProperty.get(propertyId)?.[cap]);
}

/** True if the caretaker holds `cap` on ANY assigned property (org-level actions like add tenant). */
export function anyPropertyPermission(org: OrgContext, cap: CaretakerPermKey): boolean {
  if (!org.isCaretaker) return true;
  for (const p of org.permsByProperty.values()) if (p[cap]) return true;
  return false;
}
