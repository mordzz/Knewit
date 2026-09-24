import { badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { buildUserProfile } from '@/lib/social';
import { env } from '@/lib/env';

const BUCKET = 'profile-images';
const MAX_BYTES = 2 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** Real file signatures — the upload's declared Content-Type is not
 * trusted (docs/DECISIONS.md, "Profile Image Upload Hardened"). */
function hasImageSignature(buffer: ArrayBuffer, mime: string): boolean {
  const bytes = new Uint8Array(buffer);
  const startsWith = (signature: number[]) =>
    signature.length <= bytes.length && signature.every((byte, i) => bytes[i] === byte);

  if (mime === 'image/png') {
    return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mime === 'image/jpeg') {
    return startsWith([0xff, 0xd8, 0xff]);
  }
  if (mime === 'image/webp') {
    // RIFF....WEBP
    return (
      startsWith([0x52, 0x49, 0x46, 0x46]) &&
      String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP'
    );
  }
  return false;
}

/**
 * `POST /users/me/images?kind=avatar|banner` — uploads a profile image
 * (multipart `file`) into this app's public `profile-images` bucket via
 * the service role, points the user's column at the new public URL, and
 * removes the previous object (when it's ours). Returns the updated
 * `UserProfile` so the clients can refresh in one round trip.
 *
 * Validation is honest and server-side: PNG/JPEG/WebP only, ≤2MB, and
 * only the authenticated caller's own folder is ever written.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const kind = new URL(request.url).searchParams.get('kind');
    if (kind !== 'avatar' && kind !== 'banner') {
      throw badRequest('Expected ?kind=avatar|banner.');
    }

    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) {
      throw badRequest('Expected a multipart "file" field.');
    }
    const extension = EXT_BY_MIME[file.type];
    if (!extension) {
      throw badRequest('Only PNG, JPEG, or WebP images are supported.');
    }
    if (file.size > MAX_BYTES) {
      throw badRequest('Image must be 2MB or smaller.');
    }

    const column = kind === 'avatar' ? 'avatar_url' : 'banner_url';
    const previous = kind === 'avatar' ? viewer.avatar_url : viewer.banner_url;
    const path = `${viewer.id}/${kind}-${Date.now()}.${extension}`;

    // Read once, then validate the actual bytes: `file.type` is
    // attacker-controlled (it's just the multipart Content-Type), so a
    // renamed executable would otherwise be stored under an image
    // extension. The magic-byte check is the real gate.
    const bytes = await file.arrayBuffer();
    if (!hasImageSignature(bytes, file.type)) {
      throw badRequest("That file doesn't look like a valid PNG, JPEG, or WebP image.");
    }

    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { data: updated, error } = await supabase
      .from('users')
      .update({ [column]: publicUrlData.publicUrl })
      .eq('id', viewer.id)
      .select('*')
      .single();
    if (error) throw error;

    // Best-effort cleanup of the replaced object — only when it lives in
    // our own bucket; a failure here must never fail the upload.
    const prefix = `${env.supabaseStoragePublicUrlBase}${BUCKET}/`;
    if (previous && previous.startsWith(prefix)) {
      const previousPath = previous.slice(prefix.length);
      await supabase.storage
        .from(BUCKET)
        .remove([previousPath])
        .catch(() => undefined);
    }

    return Response.json(await buildUserProfile(updated, viewer.id));
  });
}

/**
 * `DELETE /users/me/images?kind=avatar|banner` — removes the caller's
 * avatar or banner right away (clears the column and deletes the stored
 * object when it's ours), the counterpart of the immediate upload above.
 * Returns the updated `UserProfile`. Removing an image that isn't set is
 * a no-op, not an error.
 */
export async function DELETE(request: Request) {
  return withErrorHandling(async () => {
    const kind = new URL(request.url).searchParams.get('kind');
    if (kind !== 'avatar' && kind !== 'banner') {
      throw badRequest('Expected ?kind=avatar|banner.');
    }

    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const column = kind === 'avatar' ? 'avatar_url' : 'banner_url';
    const previous = kind === 'avatar' ? viewer.avatar_url : viewer.banner_url;

    const supabase = getSupabase();
    const { data: updated, error } = await supabase
      .from('users')
      .update({ [column]: null })
      .eq('id', viewer.id)
      .select('*')
      .single();
    if (error) throw error;

    // Same best-effort cleanup as a replacement upload.
    const prefix = `${env.supabaseStoragePublicUrlBase}${BUCKET}/`;
    if (previous && previous.startsWith(prefix)) {
      await supabase.storage
        .from(BUCKET)
        .remove([previous.slice(prefix.length)])
        .catch(() => undefined);
    }

    return Response.json(await buildUserProfile(updated, viewer.id));
  });
}
