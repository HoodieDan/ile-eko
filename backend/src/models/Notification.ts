import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Notification (§5.12). dedupeKey (sparse-unique) prevents double-notify on re-runs. */
const notificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['overdue', 'activity', 'ai', 'rent-due', 'lease'], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    deepLink: { type: String },
    propertyId: { type: Types.ObjectId, ref: 'Property' },
    listingId: { type: Types.ObjectId, ref: 'Listing' },
    read: { type: Boolean, default: false },
    dedupeKey: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export type NotificationDoc = HydratedDocument<InferSchemaType<typeof notificationSchema>>;
export const Notification = model('Notification', notificationSchema);
