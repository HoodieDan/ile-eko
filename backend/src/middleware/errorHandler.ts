import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';

/** 404 → { message } (matches the frontend client's error shape). */
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Not found' });
};

/**
 * Terminal error handler. Renders `{ message }` with the right status and logs
 * the stack. Unexpected errors never leak internals (NFR: clear errors).
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  // Duplicate key (e.g. unique email) → 409 with a safe message.
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({ message: 'Already exists' });
    return;
  }

  logger.error({ err }, 'unhandled error');
  res.status(500).json({ message: 'Something went wrong' });
};
