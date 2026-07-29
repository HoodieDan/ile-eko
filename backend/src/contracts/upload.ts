import { z } from 'zod';

export const UploadKind = z.enum(['property', 'unit', 'receipt', 'avatar']);
export type UploadKind = z.infer<typeof UploadKind>;

export const SignUploadInput = z.object({
  kind: UploadKind,
  resourceId: z.string().min(1), // required: capability is enforced against it (§9)
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type SignUploadInput = z.infer<typeof SignUploadInput>;

/** Signed direct-upload envelope: the client POSTs `file` + these fields to uploadUrl. */
export const SignUploadResponse = z.object({
  uploadUrl: z.string(),
  objectKey: z.string(),
  fields: z.object({
    api_key: z.string(),
    timestamp: z.number(),
    signature: z.string(),
    public_id: z.string(),
    folder: z.string(),
    type: z.string(),
  }),
});
export type SignUploadResponse = z.infer<typeof SignUploadResponse>;

export const FinalizeUploadInput = z.object({ objectKey: z.string().min(1) });
export type FinalizeUploadInput = z.infer<typeof FinalizeUploadInput>;

export const FinalizeUploadResponse = z.object({ objectKey: z.string(), url: z.string() });
export type FinalizeUploadResponse = z.infer<typeof FinalizeUploadResponse>;
