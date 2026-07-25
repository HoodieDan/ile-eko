import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Pending invite for a not-yet-linked caretaker (§5.7a). Hashed single-use token. */
const grantSchema = new Schema(
  {
    propertyId: { type: Types.ObjectId, ref: 'Property', required: true },
    role: { type: String, enum: ['caretaker', 'viewer'], default: 'caretaker' },
    permissions: {
      canLogPayments: { type: Boolean, default: false },
      canEditTenants: { type: Boolean, default: false },
      canUploadImages: { type: Boolean, default: false },
      canManageUnits: { type: Boolean, default: false },
      canEditProperty: { type: Boolean, default: false },
    },
  },
  { _id: false },
);

const invitationSchema = new Schema(
  {
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    inviteName: { type: String },
    inviteEmail: { type: String, lowercase: true, trim: true },
    invitePhone: { type: String },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    grants: { type: [grantSchema], default: [] },
    status: { type: String, enum: ['pending', 'accepted', 'expired', 'revoked'], default: 'pending' },
    resendCount: { type: Number, default: 0 },
    acceptedUserId: { type: Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
  },
  { timestamps: true },
);

export type InvitationDoc = HydratedDocument<InferSchemaType<typeof invitationSchema>>;
export const TeamInvitation = model('TeamInvitation', invitationSchema);
