import pino from 'pino';
import { env, isTest } from './env';

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  base: undefined, // drop pid/hostname noise; Cloud Logging adds its own metadata
});

export type Logger = typeof logger;
