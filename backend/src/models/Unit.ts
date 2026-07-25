import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Units — rentable targets within a property (§5.3). No writable tenantId; occupancy is lease-derived. */
const unitSchema = new Schema(
  {
    propertyId: { type: Types.ObjectId, ref: 'Property', required: true, index: true },
    unitNumber: { type: String, required: true }, // → label
    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    floor: Number,
    sizeSqm: Number,
    rentAmount: { type: Number, required: true }, // integer Naira
    paymentFrequency: { type: String, default: 'annual' },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    statusCache: { type: String, enum: ['vacant', 'occupied', 'partial'], default: 'vacant' },
    archivedAt: { type: Date },
  },
  { timestamps: true },
);

export type UnitDoc = HydratedDocument<InferSchemaType<typeof unitSchema>>;
export const Unit = model('Unit', unitSchema);
