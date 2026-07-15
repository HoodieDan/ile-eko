import { z } from 'zod';
import { IsoDate } from './common';

export const ChatInput = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(2000),
});
export type ChatInput = z.infer<typeof ChatInput>;

export const ChatResponse = z.object({
  conversationId: z.string(),
  message: z.string(),
  degraded: z.boolean().optional(),
});
export type ChatResponse = z.infer<typeof ChatResponse>;

export const AIMessageDTO = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  createdAt: IsoDate,
});
export const AIConversationDTO = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  messages: z.array(AIMessageDTO),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type AIConversationDTO = z.infer<typeof AIConversationDTO>;

/** generateObject target for the daily briefing (§7.2). */
export const BriefingObject = z.object({
  headline: z.string(),
  points: z.array(z.string()).max(6),
  actionCount: z.number().int().nonnegative(),
});
export const BriefingDTO = BriefingObject.extend({ degraded: z.boolean().optional() });
export type BriefingDTO = z.infer<typeof BriefingDTO>;

export const BriefDTO = z.object({
  kind: z.enum(['rent-due', 'overdue', 'occupancy', 'flagged']),
  title: z.string(),
  body: z.string(),
  deepLink: z.string().optional(),
});
export type BriefDTO = z.infer<typeof BriefDTO>;

/** generateObject target for smart rent pricing (§7.3). */
export const RentSuggestionObject = z.object({
  suggestedRent: z.number().int().nonnegative(),
  rationale: z.string(),
});
export const RentSuggestionDTO = RentSuggestionObject.extend({
  deltaPct: z.number(),
  comparables: z.array(z.object({ area: z.string(), rent: z.number().int() })),
  degraded: z.boolean().optional(),
});
export type RentSuggestionDTO = z.infer<typeof RentSuggestionDTO>;
