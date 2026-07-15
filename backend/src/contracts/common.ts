import { z } from 'zod';

/** Error body shape the frontend api client expects on non-2xx. */
export const ErrorBody = z.object({ message: z.string() });
export type ErrorBody = z.infer<typeof ErrorBody>;

/**
 * The single list envelope used by every list endpoint (§6). No bare arrays:
 * one convention, and any list can grow. `unreadCount` is set where meaningful
 * (enquiries, notifications).
 */
export function listEnvelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().optional(),
    total: z.number().int().nonnegative().optional(),
    unreadCount: z.number().int().nonnegative().optional(),
  });
}

export const OkResponse = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponse>;

/** ISO-8601 timestamp string (all dates are serialized as ISO strings). */
export const IsoDate = z.string();
