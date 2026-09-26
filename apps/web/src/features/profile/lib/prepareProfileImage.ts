import type { ProfileImageKind } from '@/features/profile/lib/userService';

/** Widest the stored image ever needs to be  same limits as mobile. */
const MAX_WIDTH: Record<ProfileImageKind, number> = { avatar: 512, banner: 1500 };
const JPEG_QUALITY = 0.8;

/**
 * Downscales and re-encodes a chosen image to JPEG in the browser before
 * upload. Phone photos are usually far over the backend's 2MB limit, so
 * without this most uploads were rejected; at these sizes the result is
 * typically a few hundred KB. Throws when the browser can't decode the
 * file (e.g. HEIC outside Safari).
 */
export async function prepareProfileImage(file: File, kind: ProfileImageKind): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_WIDTH[kind] / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available.');
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) throw new Error('Could not encode the image.');
    return new File([blob], `${kind}.jpg`, { type: 'image/jpeg' });
  } finally {
    bitmap.close();
  }
}
