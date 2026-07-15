import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { resolveOrg, type OrgContext } from '../rbac/access';

/** Attach the acting org context (landlord own data, or caretaker scoped) after authenticate. */
export async function attachOrg(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.auth) throw AppError.unauthorized();
  req.org = await resolveOrg(req.auth.userId, req.auth.role);
  next();
}

export function orgOf(req: Request): OrgContext {
  if (!req.org) throw AppError.unauthorized();
  return req.org;
}
