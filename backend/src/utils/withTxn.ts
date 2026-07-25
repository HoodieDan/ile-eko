import mongoose, { type ClientSession } from 'mongoose';

/** Run a function inside a short DB-only transaction and clean up the session. */
export async function withTxn<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
