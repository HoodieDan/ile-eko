import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** Enquiry (§5.6) — keyed by listingId so a tenant can enquire about a specific unit. */
const replySchema = new Schema(
  { authorId: { type: Types.ObjectId, ref: 'User', required: true }, body: { type: String, required: true }, createdAt: { type: Date, default: Date.now } },
  { _id: false },
);

const enquirySchema = new Schema(
  {
    tenantUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    listingId: { type: Types.ObjectId, ref: 'Listing', required: true, index: true },
    propertyId: { type: Types.ObjectId, ref: 'Property', required: true },
    landlordId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'replied', 'closed'], default: 'new' },
    read: { type: Boolean, default: false },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true },
);

enquirySchema.index({ landlordId: 1, read: 1, createdAt: -1 });

export type EnquiryDoc = HydratedDocument<InferSchemaType<typeof enquirySchema>>;
export const Enquiry = model('Enquiry', enquirySchema);
