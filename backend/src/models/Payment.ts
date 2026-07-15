import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Payment (§5.5c) — immutable receipt. Reversal = new offsetting row; original never mutated. */
const paymentSchema = new Schema(
  {
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
    leaseId: { type: Types.ObjectId, ref: 'Lease', required: true, index: true },
    loggedBy: { type: Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // integer Naira; negative for a reversal
    paidAt: { type: Date, required: true }, // instant
    method: { type: String, enum: ['cash', 'transfer', 'card', 'other'], default: 'transfer' },
    methodDetail: { type: String },
    periodCovered: { type: String },
    receiptKey: { type: String },
    reversalOfPaymentId: { type: Types.ObjectId, ref: 'Payment' },
    notes: { type: String },
    idempotencyKey: { type: String, required: true },
  },
  { timestamps: true },
);

paymentSchema.index({ idempotencyKey: 1 }, { unique: true });
// At most one reversal per payment.
paymentSchema.index(
  { reversalOfPaymentId: 1 },
  { unique: true, partialFilterExpression: { reversalOfPaymentId: { $exists: true } } },
);
paymentSchema.index({ leaseId: 1, paidAt: -1 });

export type PaymentDoc = HydratedDocument<InferSchemaType<typeof paymentSchema>>;
export const Payment = model('Payment', paymentSchema);
