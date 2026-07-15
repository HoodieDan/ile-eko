import { z } from 'zod';
import { RegisterableRole } from './role';
import { Capability } from './capability';
import { UserDTO } from './user';

export const RegisterInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(200),
  role: RegisterableRole, // landlord | tenant ONLY — admin/caretaker rejected (§6.1)
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(7).max(20).optional(),
    password: z.string().min(1),
  })
  .refine((v) => Boolean(v.email) || Boolean(v.phone), {
    message: 'email or phone is required',
    path: ['email'],
  });
export type LoginInput = z.infer<typeof LoginInput>;

export const AuthResponse = z.object({
  token: z.string(),
  user: UserDTO,
});
export type AuthResponse = z.infer<typeof AuthResponse>;

/** GET /auth/session → user + global capabilities. */
export const SessionDTO = z.object({
  user: UserDTO,
  capabilities: z.array(Capability),
});
export type SessionDTO = z.infer<typeof SessionDTO>;

export const RegisterPushInput = z.object({ expoPushToken: z.string().min(1) });
export type RegisterPushInput = z.infer<typeof RegisterPushInput>;

export const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>;
