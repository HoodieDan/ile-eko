import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../contracts';

/**
 * Access token carries `sub`, `role`, and `sid` (session id) — the session
 * is what makes per-device revocation real (§8). Short TTL (JWT_EXPIRES_IN).
 */
export interface TokenPayload {
  sub: string; // user id
  role: Role;
  sid: string; // session id
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof decoded.sub !== 'string' ||
    typeof (decoded as Record<string, unknown>).sid !== 'string'
  ) {
    throw new Error('Malformed token payload');
  }
  const d = decoded as jwt.JwtPayload;
  return { sub: d.sub as string, role: d.role as Role, sid: d.sid as string };
}
