import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Lease (§5.5a) — sole source of occupancy for its target. billingAmount = per-obligation charge. */
const leaseSchema = new Schema(
  {
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true },
    propertyId: { type: Types.ObjectId, ref: 'Property', required: true, index: true },
    unitId: { type: Types.ObjectId, ref: 'Unit' }, // null = standalone target
    startDate: { type: Date, required: true }, // date-only (UTC midnight)
    endDate: { type: Date, required: true },
    billingAmount: { type: Number, required: true }, // integer Naira per obligation
    annualizedRent: { type: Number, required: true },
    schedule: { type: String, required: true },
    status: { type: String, enum: ['active', 'ended', 'renewed'], default: 'active' },
    endReason: { type: String, enum: ['ended', 'evicted'] },
    endedAt: { type: Date },
    supersedesLeaseId: { type: Types.ObjectId, ref: 'Lease' },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// One ACTIVE lease per target (partial unique — historical/renewed leases coexist).
leaseSchema.index(
  { propertyId: 1, unitId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } },
);
// A person can occupy only one target at a time. Historical leases remain unrestricted.
leaseSchema.index({ tenantId: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

export type LeaseDoc = HydratedDocument<InferSchemaType<typeof leaseSchema>>;
export const Lease = model('Lease', leaseSchema);
