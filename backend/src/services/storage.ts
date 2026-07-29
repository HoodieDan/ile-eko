import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/AppError';
import { env, hasCloudinary } from '../config/env';
import { logger } from '../config/logger';
import type { UploadKind } from '../contracts';

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED: Record<UploadKind, RegExp> = {
  property: /^image\//,
  unit: /^image\//,
  avatar: /^image\//,
  receipt: /^(image\/|application\/pdf)/,
};

/** Receipts are private (owner-only signed reads); everything else is public. */
const PRIVATE_KINDS = new Set<UploadKind>(['receipt']);

let configured = false;
function configure(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export interface SignedUpload {
  /** Cloudinary endpoint the client POSTs multipart form-data to. */
  uploadUrl: string;
  /** The object key (Cloudinary public_id) to persist and send back on create/update. */
  objectKey: string;
  /** Form fields the client must include alongside `file`. */
  fields: {
    api_key: string;
    timestamp: number;
    signature: string;
    public_id: string;
    folder: string;
    type: string;
  };
}

/**
 * Issue a signed direct-upload (§9). The bytes go straight from the device to
 * Cloudinary — never through this API — and we persist only the object key.
 * Returns 503 rather than a fake URL when storage isn't configured, so a
 * misconfiguration is visible instead of silently "succeeding".
 */
export function signUpload(kind: UploadKind, contentType: string, sizeBytes: number): SignedUpload {
  if (!hasCloudinary) throw new AppError(503, 'Image uploads are not configured');
  if (!ALLOWED[kind].test(contentType)) throw AppError.badRequest('Unsupported content type');
  if (sizeBytes > MAX_BYTES) throw AppError.badRequest('File too large (max 15MB)');
  configure();

  const folder = `ile-eko/${kind}`;
  const publicId = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);
  const type = PRIVATE_KINDS.has(kind) ? 'authenticated' : 'upload';

  // Signature covers exactly the params the client will send (minus file/api_key).
  const signature = cloudinary.utils.api_sign_request(
    { folder, public_id: publicId, timestamp, type },
    env.CLOUDINARY_API_SECRET as string,
  );

  const resourceType = contentType.startsWith('image/') ? 'image' : 'raw';
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    objectKey: `${folder}/${publicId}`,
    fields: { api_key: env.CLOUDINARY_API_KEY as string, timestamp, signature, public_id: publicId, folder, type },
  };
}

/**
 * Verify the object actually landed before we let it be referenced (§9): the
 * client-supplied contentType/size at sign time are untrusted claims, so we
 * inspect the real stored asset.
 */
export async function finalizeUpload(objectKey: string): Promise<{ objectKey: string; url: string }> {
  if (!hasCloudinary) throw new AppError(503, 'Image uploads are not configured');
  if (!objectKey.startsWith('ile-eko/')) throw AppError.badRequest('Invalid object key');
  configure();

  const isPrivate = objectKey.startsWith('ile-eko/receipt');
  try {
    const res = await cloudinary.api.resource(objectKey, {
      type: isPrivate ? 'authenticated' : 'upload',
    });
    if (res.bytes > MAX_BYTES) {
      await cloudinary.uploader.destroy(objectKey, { type: isPrivate ? 'authenticated' : 'upload' });
      throw AppError.badRequest('Uploaded file exceeds the size limit and was discarded');
    }
    return { objectKey, url: urlFor(objectKey) };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn({ err, objectKey }, 'finalizeUpload: asset not found');
    throw AppError.badRequest('Upload not found — the file may not have finished uploading');
  }
}

/**
 * Delivery URL for a stored key. Public assets get a plain (auto-optimised)
 * URL; receipts are private and get a short-lived signed URL.
 */
export function urlFor(objectKey: string | undefined | null): string {
  if (!objectKey) return '';
  // Already a full URL (legacy/seed data) — pass through.
  if (/^https?:\/\//.test(objectKey)) return objectKey;
  if (!hasCloudinary) return '';
  configure();

  const isPrivate = objectKey.startsWith('ile-eko/receipt');
  return cloudinary.url(objectKey, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
    ...(isPrivate
      ? { type: 'authenticated', sign_url: true, expires_at: Math.floor(Date.now() / 1000) + 3600 }
      : { type: 'upload' }),
  });
}

/** Map a list of stored keys to delivery URLs (used by presenters). */
export function urlsFor(keys: string[] | undefined | null): string[] {
  return (keys ?? []).map(urlFor).filter(Boolean);
}
