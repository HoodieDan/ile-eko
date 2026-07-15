import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

/** AIConversation (§5.9). model + tokenCount kept server-side. */
const messageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New conversation' },
    messages: { type: [messageSchema], default: [] },
    model: { type: String, default: 'gpt-4o' },
    tokenCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ConversationDoc = HydratedDocument<InferSchemaType<typeof conversationSchema>>;
export const AIConversation = model('AIConversation', conversationSchema);
