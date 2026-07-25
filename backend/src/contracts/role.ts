import { z } from 'zod';

/** Account roles (docs §3.3.3). */
export const Role = z.enum(['landlord', 'caretaker', 'tenant', 'admin']);
export type Role = z.infer<typeof Role>;

/**
 * Public registration accepts landlord | tenant ONLY (critical, §6.1).
 * caretaker → invitation accept; admin → out-of-band provisioning.
 */
export const RegisterableRole = z.enum(['landlord', 'tenant']);
export type RegisterableRole = z.infer<typeof RegisterableRole>;
