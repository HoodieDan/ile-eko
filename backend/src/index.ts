import { createApp } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';

// Never crash the instance on a stray rejection (§10).
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandledRejection'));
process.on('uncaughtException', (err) => logger.error({ err }, 'uncaughtException'));

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();
  const port = env.PORT; // Cloud Run injects PORT; env coerces it
  app.listen(port, () => logger.info(`API listening on :${port}`));

  // Dev convenience: drain the outbox in-process. In production the outbox runs
  // as a dedicated crash-safe runtime (Cloud Tasks → /tasks/outbox, or a worker
  // service / scheduled Job) — see §13. Off unless WORKER_INLINE=true.
  if (process.env.WORKER_INLINE === 'true') {
    const { drainOutbox } = await import('./worker/outbox');
    setInterval(() => void drainOutbox().catch((err) => logger.warn({ err }, 'inline worker')), 5000);
    logger.info('inline outbox worker enabled');
  }
}

main().catch((err) => {
  logger.error({ err }, 'failed to start');
  process.exit(1);
});
