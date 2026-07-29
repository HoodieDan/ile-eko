import * as ImagePicker from 'expo-image-picker';

/** A locally-picked image, shaped for `useUpload()`'s input. */
export interface PickedImage {
  uri: string;
  mimeType?: string;
  sizeBytes?: number;
  fileName?: string;
}

export type PickResult =
  | { status: 'picked'; images: PickedImage[] }
  | { status: 'cancelled' }
  | { status: 'denied' };

/**
 * Asks for library permission, opens the picker and normalises the assets into
 * the shape `useUpload()` expects. Never throws for the ordinary outcomes —
 * callers switch on `status`.
 */
export async function pickImages(options?: { multiple?: boolean }): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsMultipleSelection: options?.multiple ?? false,
  });
  if (result.canceled || result.assets.length === 0) return { status: 'cancelled' };

  return {
    status: 'picked',
    images: result.assets.map((asset) => ({
      uri: asset.uri,
      ...(asset.mimeType ? { mimeType: asset.mimeType } : {}),
      ...(typeof asset.fileSize === 'number' ? { sizeBytes: asset.fileSize } : {}),
      ...(asset.fileName ? { fileName: asset.fileName } : {}),
    })),
  };
}
