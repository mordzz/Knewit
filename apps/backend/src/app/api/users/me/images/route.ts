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

    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });
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
