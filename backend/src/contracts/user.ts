import { z } from 'zod';
import { Role } from './role';
import { IsoDate } from './common';

/** Public user shape returned to the client (matches @ile-eko/core `User`). */
export const UserDTO = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: Role,
  avatarUrl: z.string().optional(),
  isVerified: z.boolean(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type UserDTO = z.infer<typeof UserDTO>;

/** A signed-in device (§8). */
export const SessionInfoDTO = z.object({
  id: z.string(),
  deviceLabel: z.string().optional(),
  createdAt: IsoDate,
  lastSeenAt: IsoDate,
  current: z.boolean(),
});
export type SessionInfoDTO = z.infer<typeof SessionInfoDTO>;
