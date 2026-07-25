import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

/**
 * Validate a request part against a Zod contract before the controller runs.
 * On success the parsed value replaces the raw input; on failure → 400 { message }.
 */
export function validate<T extends ZodTypeAny>(schema: T, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      const path = first?.path.join('.') ?? source;
      throw AppError.badRequest(`${path}: ${first?.message ?? 'Invalid input'}`);
    }
    // Overwrite only for body/params; query is read-only on Express 5.
    if (source === 'query') {
      (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    } else {
      req[source] = result.data as ZodInfer<T>;
    }
    next();
  };
}
