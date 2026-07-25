import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Tenant — identity only; lease/rent facts live on the Lease (§5.4). */
const tenantSchema = new Schema(
  {
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    addedBy: { type: Types.ObjectId, ref: 'User', required: true },
    tenantName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    userId: { type: Types.ObjectId, ref: 'User' }, // marketplace account link
    notes: { type: String },
    riskCache: {
      type: new Schema(
        {
          band: { type: String, enum: ['low', 'medium', 'high'] },
          score: Number,
          reason: String,
          scoringVersion: String,
          computedAt: Date,
        },
        { _id: false },
      ),
      required: false,
    },
    archivedAt: { type: Date },
  },
  { timestamps: true },
);

export type TenantDoc = HydratedDocument<InferSchemaType<typeof tenantSchema>>;
export const Tenant = model('Tenant', tenantSchema);
