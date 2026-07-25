import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** ListingView (§5.14) — anonymous view dedupe + recently-viewed. TTL 30d, hashed viewerKey. */
const viewSchema = new Schema(
  {
    listingId: { type: Types.ObjectId, ref: 'Listing', required: true },
    viewerKey: { type: String, required: true }, // sha256(userId | sessionId + salt)
    userId: { type: Types.ObjectId, ref: 'User' }, // set when authed (recently-viewed)
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
viewSchema.index({ listingId: 1, viewerKey: 1 }, { unique: true });
viewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
viewSchema.index({ userId: 1, createdAt: -1 });

export type ListingViewDoc = HydratedDocument<InferSchemaType<typeof viewSchema>>;
export const ListingView = model('ListingView', viewSchema);
