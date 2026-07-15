import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * Scoped idempotency store (§5.13a). Keyed by (principalId, operation, key) so
 * two users can't collide on the same client-chosen key; `requestHash` lets us
 * return the stored response on an identical retry and 409 on a body mismatch.
 * TTL ~24h. (Wired into mutating POSTs from M2 onward.)
 */
const idempotencySchema = new Schema(
  {
    principalId: { type: String, required: true },
    operation: { type: String, required: true },
    key: { type: String, required: true },
    requestHash: { type: String, required: true },
    response: { type: Schema.Types.Mixed },
    statusCode: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

idempotencySchema.index({ principalId: 1, operation: 1, key: 1 }, { unique: true });
idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export type IdempotencyDoc = HydratedDocument<InferSchemaType<typeof idempotencySchema>>;

export const IdempotencyRecord = model('IdempotencyRecord', idempotencySchema);
