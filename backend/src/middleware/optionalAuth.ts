import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { Session, User } from '../models';
import type { Role } from '../contracts';

/**
 * Best-effort auth for public endpoints (browse-first, §6.10). Attaches req.auth
 * when a valid token + session is present; otherwise continues anonymously.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = verifyToken(header.slice(7).trim());
    const session = await Session.findById(payload.sid);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return next();
    const user = await User.findById(payload.sub);
    if (!user || user.isDisabled) return next();
    req.auth = { userId: user.id, role: user.role as Role, sessionId: session.id, user, session };
  } catch {
    // ignore — anonymous
  }
  next();
}
