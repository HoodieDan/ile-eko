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

export const SignUploadResponse = z.object({
  uploadUrl: z.string(),
  objectKey: z.string(),
});
export type SignUploadResponse = z.infer<typeof SignUploadResponse>;

export const FinalizeUploadInput = z.object({ objectKey: z.string().min(1) });
export type FinalizeUploadInput = z.infer<typeof FinalizeUploadInput>;
