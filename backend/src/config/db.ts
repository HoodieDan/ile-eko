import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

/**
 * Mongoose connection. Pool is kept small per instance so that
 * (Cloud Run instances × maxPoolSize) stays under the Atlas connection limit (§13).
 */
export async function connectDb(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => logger.error({ err }, 'mongo connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('mongo disconnected'));

  await mongoose.connect(uri, {
    maxPoolSize: env.MONGO_MAX_POOL_SIZE,
    serverSelectionTimeoutMS: 10_000,
  });

  logger.info('mongo connected');
  return mongoose;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
