import { z } from 'zod';
import { IsoDate } from './common';

/** Tenant-side enquiry (§5.6). */
export const EnquiryDTO = z.object({
  id: z.string(),
  tenantUserId: z.string(),
  listingId: z.string(),
  propertyId: z.string(),
  message: z.string(),
  status: z.enum(['new', 'replied', 'closed']),
  createdAt: IsoDate,
  reply: z.string().optional(), // latest landlord reply (for /enquiries/mine)
});
export type EnquiryDTO = z.infer<typeof EnquiryDTO>;

/** Landlord inbox item (richer than the tenant DTO, §6.6). */
export const EnquiryInboxDTO = z.object({
  id: z.string(),
  listingId: z.string(),
  targetLabel: z.string(),
  tenantName: z.string(),
  message: z.string(),
  snippet: z.string(),
  read: z.boolean(),
  status: z.enum(['new', 'replied', 'closed']),
  replies: z.array(z.object({ authorId: z.string(), body: z.string(), createdAt: IsoDate })),
  createdAt: IsoDate,
});
export type EnquiryInboxDTO = z.infer<typeof EnquiryInboxDTO>;

export const CreateEnquiryInput = z.object({
  listingId: z.string().min(1),
  message: z.string().min(1).max(2000),
});
export type CreateEnquiryInput = z.infer<typeof CreateEnquiryInput>;

export const ReplyInput = z.object({ body: z.string().min(1).max(2000) });
export type ReplyInput = z.infer<typeof ReplyInput>;
