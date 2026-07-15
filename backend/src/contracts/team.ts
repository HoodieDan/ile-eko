import { z } from 'zod';
import { IsoDate } from './common';
import { CaretakerPermissions } from './capability';

export const RolePermissionDTO = z.object({
  id: z.string(),
  propertyId: z.string(),
  caretakerUserId: z.string(),
  invitedBy: z.string(),
  role: z.enum(['caretaker', 'viewer']),
  canLogPayments: z.boolean(),
  canEditTenants: z.boolean(),
  canUploadImages: z.boolean(),
  canManageUnits: z.boolean(),
  canEditProperty: z.boolean(),
  status: z.enum(['active', 'revoked']),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type RolePermissionDTO = z.infer<typeof RolePermissionDTO>;

export const CaretakerSummaryDTO = z.object({
  id: z.string(), // caretaker user id
  name: z.string(),
  email: z.string().optional(),
  status: z.enum(['active', 'revoked', 'pending']),
  propertyCount: z.number().int(),
  areas: z.array(z.string()),
});
export type CaretakerSummaryDTO = z.infer<typeof CaretakerSummaryDTO>;

export const InviteGrant = z.object({
  propertyId: z.string(),
  role: z.enum(['caretaker', 'viewer']).default('caretaker'),
  permissions: CaretakerPermissions.partial().default({}),
});
export type InviteGrant = z.infer<typeof InviteGrant>;

export const InviteInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  grants: z.array(InviteGrant).min(1),
});
export type InviteInput = z.infer<typeof InviteInput>;

export const AcceptInviteInput = z.object({
  inviteToken: z.string().min(1),
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(), // required if new user
});
export type AcceptInviteInput = z.infer<typeof AcceptInviteInput>;

export const UpdateCaretakerInput = z.object({
  propertyId: z.string(),
  permissions: CaretakerPermissions.partial().optional(),
  status: z.enum(['active', 'revoked']).optional(),
});
export type UpdateCaretakerInput = z.infer<typeof UpdateCaretakerInput>;
