import type { ClientSession } from 'mongoose';
import { OutboxEvent } from '../models';

export interface EmitEventInput {
  type: string;
  payload: Record<string, unknown>;
  dedupeKey: string; // idempotent on this; unique index prevents duplicate events
}

/** Write an outbox event inside the state-change transaction (§8.1). */
export async function emitEvent(session: ClientSession, input: EmitEventInput): Promise<void> {
  // Upsert-style: ignore duplicate dedupeKey (already scheduled).
  try {
    await OutboxEvent.create(
      [
        {
          type: input.type,
          payload: input.payload,
          dedupeKey: input.dedupeKey,
          status: 'pending',
          nextAttemptAt: new Date(),
        },
      ],
      { session },
    );
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return; // already emitted
    throw err;
  }
}
