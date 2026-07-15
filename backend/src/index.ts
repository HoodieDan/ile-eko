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
}

main().catch((err) => {
  logger.error({ err }, 'failed to start');
  process.exit(1);
});
