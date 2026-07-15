import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';
import { Session, User } from '../models';
import type { Role } from '../contracts';

/**
 * Verify the JWT, then validate its Session (§8): rejects revoked/expired
 * sessions and disabled users. This is what makes per-device revocation real —
 * one indexed session read per authenticated request, by design (not cached).
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing bearer token');
  }
  const token = header.slice('Bearer '.length).trim();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }

  const session = await Session.findById(payload.sid);
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw AppError.unauthorized('Session is no longer valid');
  }
  if (String(session.userId) !== payload.sub) {
    throw AppError.unauthorized('Session/user mismatch');
  }

  const user = await User.findById(payload.sub).select('+password');
  if (!user || user.isDisabled) {
    throw AppError.unauthorized('Account unavailable');
  }

  // Sliding session: refresh lastSeenAt (best-effort, don't block the request).
  if (env.SESSION_SLIDING) {
    session.lastSeenAt = new Date();
    void session.save().catch(() => undefined);
  }

  req.auth = {
    userId: user.id,
    role: user.role as Role,
    sessionId: session.id,
    user,
    session,
  };
  next();
}
