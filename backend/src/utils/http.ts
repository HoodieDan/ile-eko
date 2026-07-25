import type { Request } from 'express';
import { AppError } from './AppError';

/** The audit actor for a request. */
export function actorFrom(req: Request): { userId: string; name: string } {
  if (!req.auth) throw AppError.unauthorized();
  return { userId: req.auth.userId, name: req.auth.user.fullName };
}

/** The landlord scope for a request (landlord owns their data; admin acts as itself). */
export function landlordScope(req: Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.userId;
}

/** Read validated query stashed by the validate middleware, falling back to req.query. */
export function validatedQuery<T>(req: Request): T {
  return ((req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query) as T;
}
