import type { UserDoc } from '../models';
import type { SessionDoc } from '../models';
import type { Role, UserDTO, SessionInfoDTO } from '../contracts';

/**
 * Document → DTO mapping (§5: presenters, not toJSON). Renames docs fields to
 * the frontend shape and never leaks password / owner-private fields.
 */
export function presentUser(u: UserDoc): UserDTO {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    ...(u.phoneNumber ? { phone: u.phoneNumber } : {}),
    role: u.role as Role,
    ...(u.profileImage ? { avatarUrl: u.profileImage } : {}),
    isVerified: Boolean(u.isVerified),
    createdAt: (u.createdAt as Date).toISOString(),
    updatedAt: (u.updatedAt as Date).toISOString(),
  };
}

export function presentSessionInfo(s: SessionDoc, currentSid: string): SessionInfoDTO {
  return {
    id: s.id,
    ...(s.deviceLabel ? { deviceLabel: s.deviceLabel } : {}),
    createdAt: (s.createdAt as Date).toISOString(),
    lastSeenAt: (s.lastSeenAt as Date).toISOString(),
    current: s.id === currentSid,
  };
}
