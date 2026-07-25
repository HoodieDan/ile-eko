import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * Users collection (§5.1). Persists docs fields; the presenter maps to UserDTO
 * (fullName→name, profileImage→avatarUrl, phoneNumber→phone). Password is
 * select:false and never serialized. `preferences`/push tokens live on Session
 * or are owner-only. No tokenVersion — revocation is per-device via Session (§8).
 */
const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    phoneNumber: { type: String, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['landlord', 'caretaker', 'tenant', 'admin'],
    },
    profileImage: { type: String }, // GCS object key (signed on read), never a URL
    isVerified: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false }, // admin disable → blocks auth
    lastLogin: { type: Date },
    preferences: {
      type: new Schema(
        {
          budgetMin: Number,
          budgetMax: Number,
          areas: { type: [String], default: [] },
          sizeLabel: String,
          bedrooms: Number,
        },
        { _id: false },
      ),
      required: false,
    },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const User = model('User', userSchema);
