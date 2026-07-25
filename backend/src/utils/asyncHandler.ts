import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Belt-and-suspenders async wrapper (§10). Express 5 forwards rejected
 * promises to the error middleware natively, but wrapping keeps behavior
 * explicit and identical across handlers.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
