import rateLimit from 'express-rate-limit';
import { env, isTest } from '../config/env';

const disabled = isTest; // don't rate-limit in tests

/** General limiter (mounted app-wide). */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => disabled,
});

/** Tight limiter for auth + token-bearing public routes (§10). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => disabled,
});
