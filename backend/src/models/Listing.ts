import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/**
 * Listing — first-class marketplace offering + materialized read model (§5.3a).
 * Denormalized searchable fields are refreshed transactionally when the source
 * property/unit/lease changes, so /listings & /search index one collection.
 */
const listingSchema = new Schema(
  {
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: Types.ObjectId, ref: 'Property', required: true, index: true },
    unitId: { type: Types.ObjectId, ref: 'Unit' }, // null = standalone target
    listed: { type: Boolean, default: false },
    available: { type: Boolean, default: true }, // no active lease on the target
    listedAt: { type: Date },
    views: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    // materialized projection
    title: String,
    area: String,
    lga: String,
    type: String,
    rent: Number,
    beds: Number,
    baths: Number,
    size: Number,
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    description: { type: String, default: '' },
    landlordName: String,
    searchText: String,
  },
  { timestamps: true },
);

listingSchema.index({ propertyId: 1, unitId: 1 }, { unique: true });
listingSchema.index({ listed: 1, available: 1, area: 1, rent: 1, beds: 1 });
listingSchema.index({ searchText: 'text' });

export type ListingDoc = HydratedDocument<InferSchemaType<typeof listingSchema>>;
export const Listing = model('Listing', listingSchema);
