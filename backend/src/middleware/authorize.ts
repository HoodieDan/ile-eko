import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../utils/AppError';
import { hasGlobalCapability } from '../rbac/capabilities';
import type { Capability, Role } from '../contracts';

/** Require one of the given account roles. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw AppError.unauthorized();
    if (!roles.includes(req.auth.role)) throw AppError.forbidden('Insufficient role');
    next();
  };
}

/**
 * Require a global capability (§8). Per-property caretaker capabilities are
 * resolved by a separate resource guard when those modules land (M2/M3).
 */
export function requireCapability(cap: Capability): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw AppError.unauthorized();
    if (!hasGlobalCapability(req.auth.role, cap)) throw AppError.forbidden('Not permitted');
    next();
  };
}
