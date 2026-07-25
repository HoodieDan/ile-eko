import { api } from '../api/client';
import type { User } from '../types';
import type { LoginInput, RegisterInput } from './AuthProvider';

export interface AuthResult {
  token: string;
  user: User;
}

/** Real auth calls against the backend (`/auth/*`). Pass these into <AuthProvider>. */
export function apiLogin(input: LoginInput): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/login', input);
}

export function apiRegister(input: RegisterInput): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/register', input);
}

/** Hydrate the current user from a stored token on boot; null if the token is invalid. */
export async function apiSession(): Promise<User | null> {
  try {
    const res = await api.get<{ user: User }>('/auth/session');
    return res?.user ?? null;
  } catch {
    return null;
  }
}

/** Revoke this device's session server-side (best-effort). */
export async function apiLogout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore — the local token is cleared regardless
  }
}
