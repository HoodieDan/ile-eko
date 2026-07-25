import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/** OutboxEvent (§5.13) — written in the state-change txn; drained by a crash-safe worker. */
const outboxSchema = new Schema(
  {
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    nextAttemptAt: { type: Date, default: Date.now },
    lockedBy: { type: String },
    lockedUntil: { type: Date },
    dedupeKey: { type: String, required: true },
  },
  { timestamps: true },
);

outboxSchema.index({ dedupeKey: 1 }, { unique: true });
outboxSchema.index({ status: 1, nextAttemptAt: 1 });

export type OutboxEventDoc = HydratedDocument<InferSchemaType<typeof outboxSchema>>;
export const OutboxEvent = model('OutboxEvent', outboxSchema);

/** EffectDelivery — one row per (event, effect) so each external effect runs once per success. */
const effectSchema = new Schema(
  {
    outboxEventId: { type: Schema.Types.ObjectId, ref: 'OutboxEvent', required: true },
    effect: { type: String, required: true },
    providerId: { type: String },
    status: { type: String, default: 'sent' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
effectSchema.index({ outboxEventId: 1, effect: 1 }, { unique: true });

export type EffectDeliveryDoc = HydratedDocument<InferSchemaType<typeof effectSchema>>;
export const EffectDelivery = model('EffectDelivery', effectSchema);
