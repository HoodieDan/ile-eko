import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/**
 * Per-device session (§8). The JWT carries this row's id as `sid`; authenticate
 * validates it, so revoking a row logs out exactly one device. Password change
 * revokes the *other* sessions; reset/disable/caretaker-revoke revoke all.
 */
const sessionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    deviceLabel: { type: String },
    expoPushToken: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: false },
);

// TTL: prune sessions after they expire.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDoc = HydratedDocument<InferSchemaType<typeof sessionSchema>>;

export const Session = model('Session', sessionSchema);
