import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** PaymentAllocation (§5.5d) — assigns a payment to an obligation (can be negative for reversals). */
const allocationSchema = new Schema(
  {
    paymentId: { type: Types.ObjectId, ref: 'Payment', required: true, index: true },
    obligationId: { type: Types.ObjectId, ref: 'RentObligation', required: true, index: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true },
);

export type AllocationDoc = HydratedDocument<InferSchemaType<typeof allocationSchema>>;
export const PaymentAllocation = model('PaymentAllocation', allocationSchema);
