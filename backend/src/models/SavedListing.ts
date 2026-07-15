import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** SavedListing (§5.10) — keyed by listingId (a specific offering, not the building). */
const savedSchema = new Schema(
  {
    tenantUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    listingId: { type: Types.ObjectId, ref: 'Listing', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
savedSchema.index({ tenantUserId: 1, listingId: 1 }, { unique: true });

export type SavedListingDoc = HydratedDocument<InferSchemaType<typeof savedSchema>>;
export const SavedListing = model('SavedListing', savedSchema);
