import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/**
 * RentObligation (§5.5b) — one row per period. `settlement` is DATE-INDEPENDENT
 * (from amountAllocated vs amountDue); the due/overdue/upcoming component is
 * derived at query time so a missed sweep never staled it.
 */
const obligationSchema = new Schema(
  {
    leaseId: { type: Types.ObjectId, ref: 'Lease', required: true, index: true },
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
    propertyId: { type: Types.ObjectId, ref: 'Property', required: true },
    unitId: { type: Types.ObjectId, ref: 'Unit' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    amountDue: { type: Number, required: true },
    amountAllocated: { type: Number, default: 0 },
    settlement: {
      type: String,
      enum: ['unallocated', 'partial', 'paid'],
      default: 'unallocated',
    },
  },
  { timestamps: true },
);

obligationSchema.index({ landlordId: 1, settlement: 1, dueDate: 1 });
obligationSchema.index({ leaseId: 1, dueDate: 1 });

export type ObligationDoc = HydratedDocument<InferSchemaType<typeof obligationSchema>>;
export const RentObligation = model('RentObligation', obligationSchema);
