import { useMutation } from '@tanstack/react-query';
import { api, newIdempotencyKey } from '../api/client';

export type UploadKind = 'property' | 'unit' | 'receipt' | 'avatar';

interface SignResponse {
  uploadUrl: string;
  objectKey: string;
  fields: {
    api_key: string;
    timestamp: number;
    signature: string;
    public_id: string;
    folder: string;
    type: string;
  };
}

export interface UploadInput {
  kind: UploadKind;
  /** The resource the upload belongs to (permission is enforced against it). */
  resourceId: string;
  /** Local file URI from expo-image-picker. */
  uri: string;
  mimeType?: string;
  sizeBytes?: number;
  fileName?: string;
}

export interface UploadResult {
  /** Persist this on the parent resource (e.g. property.images). */
  objectKey: string;
  /** Ready-to-render delivery URL. */
  url: string;
}

/**
 * Three-step upload (§9): ask the API to sign → PUSH THE BYTES STRAIGHT TO
 * CLOUDINARY (never through our server) → ask the API to verify and hand back a
 * delivery URL. Returns the object key to store on the parent resource.
 */
export function useUpload() {
  return useMutation<UploadResult, Error, UploadInput>({
    mutationFn: async (input) => {
      const mimeType = input.mimeType ?? 'image/jpeg';

      // 1. Signed upload envelope from our API.
      const signed = await api.post<SignResponse>(
        '/uploads/sign',
        {
          kind: input.kind,
          resourceId: input.resourceId,
          contentType: mimeType,
          sizeBytes: input.sizeBytes ?? 1,
        },
        { idempotencyKey: newIdempotencyKey() },
      );

      // 2. Direct multipart POST to Cloudinary.
      const form = new FormData();
      // React Native's FormData accepts this {uri,name,type} shape for files.
      form.append('file', {
        uri: input.uri,
        name: input.fileName ?? `${signed.fields.public_id}.jpg`,
        type: mimeType,
      } as unknown as Blob);
      for (const [k, v] of Object.entries(signed.fields)) form.append(k, String(v));

      const res = await fetch(signed.uploadUrl, { method: 'POST', body: form });
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }

      // 3. Verify server-side and get the delivery URL.
      return api.post<UploadResult>('/uploads/finalize', { objectKey: signed.objectKey });
    },
  });
}
