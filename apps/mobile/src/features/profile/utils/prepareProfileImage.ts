import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { ProfileImageFile } from '@/features/profile/services/userService';

/** Widest the stored image ever needs to be: the avatar renders at most
 * ~96pt (×3 density), the banner full-width at ~3:1. */
const MAX_WIDTH: Record<'avatar' | 'banner', number> = {
  avatar: 512,
  banner: 1500,
};
const JPEG_QUALITY = 0.8;

/**
 * Downscales and re-encodes a picked photo to a JPEG before upload.
 * Phone camera photos are routinely 3-12MB, far over the backend's 2MB
 * limit, which made most avatar/banner uploads fail outright; at these
 * sizes the result is typically well under 500KB. Also normalizes HEIC
 * and other formats the backend doesn't accept (PNG/JPEG/WebP only).
 */
export async function prepareProfileImage(
  asset: ImagePickerAsset,
  kind: 'avatar' | 'banner'
): Promise<ProfileImageFile> {
  const context = ImageManipulator.manipulate(asset.uri);
  const maxWidth = MAX_WIDTH[kind];
  if (asset.width > maxWidth) {
    // Height follows from the aspect ratio when only width is given.
    context.resize({ width: maxWidth });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });

  return { uri: result.uri, name: `${kind}.jpg`, type: 'image/jpeg' };
}
