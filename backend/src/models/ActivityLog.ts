import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** ActivityLog (§5.8) — written in the same transaction as the state change. */
const activitySchema = new Schema(
  {
    actorId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    actorName: { type: String, required: true },
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    category: { type: String, required: true },
    propertyId: { type: Types.ObjectId, ref: 'Property', index: true },
    entityId: { type: Types.ObjectId },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    flag: { type: String }, // optional AI note
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

activitySchema.index({ landlordId: 1, createdAt: -1 });
activitySchema.index({ propertyId: 1, createdAt: -1 });

export type ActivityLogDoc = HydratedDocument<InferSchemaType<typeof activitySchema>>;
export const ActivityLog = model('ActivityLog', activitySchema);
