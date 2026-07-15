import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Properties (§5.2). `statusCache` is DERIVED from active leases, refreshed transactionally. */
const propertySchema = new Schema(
  {
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    propertyTitle: { type: String, required: true },
    address: { type: String, required: true },
    area: { type: String, required: true },
    lga: { type: String, required: true },
    propertyType: { type: String, required: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] }, // GCS object keys
    hasUnits: { type: Boolean, default: false },
    bedrooms: Number,
    bathrooms: Number,
    sizeSqm: Number,
    amenities: { type: [String], default: [] },
    paymentFrequency: { type: String, default: 'annual' },
    rentAmount: Number, // integer Naira; standalone base rent
    verified: { type: Boolean, default: false },
    statusCache: { type: String, enum: ['vacant', 'occupied', 'partial'], default: 'vacant' },
    archivedAt: { type: Date },
  },
  { timestamps: true },
);

propertySchema.index({ landlordId: 1, archivedAt: 1 });
propertySchema.index({ propertyTitle: 'text', address: 'text', area: 'text', description: 'text' });

export type PropertyDoc = HydratedDocument<InferSchemaType<typeof propertySchema>>;
export const Property = model('Property', propertySchema);
