import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Per-property caretaker RBAC record (§5.7). Always references an existing user. */
const membershipSchema = new Schema(
  {
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    caretakerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: Types.ObjectId, ref: 'Property', required: true, index: true },
    role: { type: String, enum: ['caretaker', 'viewer'], default: 'caretaker' },
    canLogPayments: { type: Boolean, default: false },
    canEditTenants: { type: Boolean, default: false },
    canUploadImages: { type: Boolean, default: false },
    canManageUnits: { type: Boolean, default: false },
    canEditProperty: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  },
  { timestamps: true },
);

membershipSchema.index({ caretakerId: 1, propertyId: 1 }, { unique: true });

export type MembershipDoc = HydratedDocument<InferSchemaType<typeof membershipSchema>>;
export const TeamMembership = model('TeamMembership', membershipSchema);
