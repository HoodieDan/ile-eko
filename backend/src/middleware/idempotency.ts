import { createHash } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../utils/AppError';
import { IdempotencyRecord } from '../models';

function hashBody(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
}

/**
 * Scoped idempotency (§5.13a, §8.1). Requires an `Idempotency-Key` header on the
 * mutating POSTs. Key is scoped to (principalId, operation) so users can't collide;
 * same body → replay stored response; different body, same key → 409.
 */
export function idempotent(operation: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) throw AppError.unauthorized();
    const key = req.get('idempotency-key');
    if (!key) throw AppError.badRequest('Idempotency-Key header is required');

    const principalId = req.auth.userId;
    const requestHash = hashBody(req.body);

    const existing = await IdempotencyRecord.findOne({ principalId, operation, key });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw AppError.conflict('Idempotency-Key reused with a different request body');
      }
      res.status(existing.statusCode).json(existing.response);
      return;
    }

    // Capture the response body to persist on success.
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        void IdempotencyRecord.create({
          principalId,
          operation,
          key,
          requestHash,
          response: body,
          statusCode: res.statusCode,
        }).catch(() => undefined);
      }
      return originalJson(body);
    }) as Response['json'];

    // Expose the key to the controller (used as the payment ledger idempotencyKey).
    (req as Request & { idempotencyKey?: string }).idempotencyKey = `${operation}:${principalId}:${key}`;
    next();
  };
}
