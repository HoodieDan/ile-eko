import { randomUUID } from 'node:crypto';
import { AppError } from '../utils/AppError';
import type { UploadKind } from '../contracts';

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED: Record<UploadKind, RegExp> = {
  property: /^image\//,
  unit: /^image\//,
  avatar: /^image\//,
  receipt: /^(image\/|application\/pdf)/,
};

export interface SignedUpload {
  uploadUrl: string;
  objectKey: string;
}

/**
 * Storage abstraction (§9). Validates MIME/size, generates a server-side object
 * key. In dev/test a stub driver returns a placeholder URL; the real GCS
 * IAM-signBlob driver + finalize verification land in M6.
 */
export function signUpload(kind: UploadKind, contentType: string, sizeBytes: number): SignedUpload {
  if (!ALLOWED[kind].test(contentType)) throw AppError.badRequest('Unsupported content type');
  if (sizeBytes > MAX_BYTES) throw AppError.badRequest('File too large');
  const objectKey = `${kind}/${randomUUID()}`;
  const uploadUrl = `https://storage.googleapis.local/${objectKey}?stub-signed`;
  return { uploadUrl, objectKey };
}

/**
 * Finalize: verify the object exists and inspect its real metadata (§9). The
 * stub trusts the key; the GCS driver (M6) performs a real HEAD + size/type check.
 */
export async function finalizeUpload(objectKey: string): Promise<{ objectKey: string }> {
  if (!objectKey.includes('/')) throw AppError.badRequest('Invalid object key');
  return { objectKey };
}
