import { EffectDelivery, Enquiry, OutboxEvent, User, type OutboxEventDoc } from '../models';
import { logger } from '../config/logger';
import { notify } from '../services/notify';
import { recomputeRisk } from '../ai/risk';

const LOCK_MS = 60_000;
const MAX_ATTEMPTS = 5;
const workerId = `w-${Math.floor(Date.now() % 1e6)}`;

/** Idempotent per (event, effect): record delivery, skip if already delivered. */
async function once(eventId: string, effect: string, fn: () => Promise<void>): Promise<void> {
  const existing = await EffectDelivery.findOne({ outboxEventId: eventId, effect }).lean();
  if (existing) return;
  await fn();
  try {
    await EffectDelivery.create({ outboxEventId: eventId, effect });
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
  }
}

async function process(event: OutboxEventDoc): Promise<void> {
  const p = event.payload as Record<string, string>;
  switch (event.type) {
    case 'enquiry.received': {
      await once(event.id, 'notify-landlord', async () => {
        const enquiry = await Enquiry.findById(p.enquiryId).lean();
        if (!enquiry) return;
        await notify({
          userId: String(enquiry.landlordId),
          type: 'activity',
          title: 'New enquiry',
          body: enquiry.message.slice(0, 100),
          deepLink: 'ileeko://enquiries',
          dedupeKey: `enquiry.received:${event.id}`,
        });
      });
      break;
    }
    case 'enquiry.replied': {
      await once(event.id, 'notify-tenant', async () => {
        await notify({
          userId: p.tenantUserId!,
          type: 'activity',
          title: 'Landlord replied',
          body: 'You have a reply to your enquiry.',
          deepLink: 'ileeko://enquiries',
          dedupeKey: `enquiry.replied:${event.id}`,
        });
      });
      break;
    }
    case 'payment.logged': {
      await once(event.id, 'recompute-risk', async () => {
        if (p.tenantId) await recomputeRisk(p.tenantId);
      });
      break;
    }
    // lease.created / lease.ended: no external effect for now.
    default:
      break;
  }
}

/** Claim + process one batch of pending outbox events (crash-safe, at-least-once). */
export async function processOutboxOnce(limit = 20): Promise<number> {
  let processed = 0;
  for (let i = 0; i < limit; i++) {
    const now = new Date();
    const event = await OutboxEvent.findOneAndUpdate(
      {
        status: { $in: ['pending', 'processing'] },
        nextAttemptAt: { $lte: now },
        $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lt: now } }],
      },
      { $set: { status: 'processing', lockedBy: workerId, lockedUntil: new Date(now.getTime() + LOCK_MS) }, $inc: { attempts: 1 } },
      { new: true, sort: { nextAttemptAt: 1 } },
    );
    if (!event) break;

    try {
      await process(event);
      event.status = 'done';
      event.lockedUntil = undefined;
      await event.save();
      processed += 1;
    } catch (err) {
      logger.error({ err, eventId: event.id }, 'outbox processing failed');
      event.status = event.attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
      event.lastError = String((err as Error).message ?? err);
      event.nextAttemptAt = new Date(Date.now() + Math.min(2 ** event.attempts * 1000, 60_000));
      event.lockedUntil = undefined;
      await event.save();
    }
  }
  return processed;
}

/** Drain the queue until empty (used by /tasks/outbox and tests). */
export async function drainOutbox(): Promise<number> {
  let total = 0;
  for (;;) {
    const n = await processOutboxOnce();
    total += n;
    if (n === 0) break;
  }
  return total;
}
