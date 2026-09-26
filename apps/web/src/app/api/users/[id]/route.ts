import { ApiError, badRequest, notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth, requireAuth } from '@/lib/privy';
import { getOrCreateUser, resolveTargetUserId } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { buildUserProfile, fetchUserProfile } from '@/lib/social';
import { env } from '@/lib/env';
import { HANDLE_RE, isHandleUsedByPolymarketTrader } from '@/lib/handles';
import type { UpdateProfileInput } from '@/types/social';

const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 160;

/** `GET /users/:id`  `:id` accepts the literal `"me"` (docs/API.md).
 * Public read: an unauthenticated caller gets `isFollowing: false`,
 * `isSelf: false`, never a 401. The user row, counts, and follow state
 * come from one `user_profile_overview` query
 * (`lib/social.ts::fetchUserProfile`). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const targetId = await resolveTargetUserId(id, viewer?.privyUserId ?? null);
    const profile = await fetchUserProfile(targetId, viewerUserRow?.id ?? null);
    if (!profile) {
      throw notFound(`User ${id} not found.`);
    }

    return Response.json(profile);
  });
}

/** Only URLs inside this app's public `profile-images` bucket are ever
 * accepted for avatar/banner  never an arbitrary remote URL (which
 * could point at anything and would be rendered for every visitor). */
function profileImagePrefix(): string {
  return `${env.supabaseStoragePublicUrlBase}profile-images/`;
}

/** `undefined` keeps the current image, `''`/`null` clears it. */
function parseImageField(value: unknown, field: string, current: string | null): string | null {
  if (value === undefined) return current;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !value.startsWith(profileImagePrefix())) {
    throw badRequest(`${field} must be an uploaded profile image URL.`);
  }
  return value;
}

/** `PATCH /users/me`  the only mutable profile route; `:id` must be
 * the literal `"me"` (docs/API.md). Editable: display name, username
 * (`handle`, lowercase + unique), bio, avatar, and banner image (the
 * latter two as URLs returned by `POST /users/me/images`). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    if (id !== 'me') {
      throw badRequest('Only the authenticated caller\'s own profile ("me") can be edited.');
    }

    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<UpdateProfileInput> | null;
    if (
      !body ||
      typeof body.displayName !== 'string' ||
      typeof body.handle !== 'string' ||
      typeof body.bio !== 'string'
    ) {
      throw badRequest('Expected { displayName, handle, bio, avatarUrl?, bannerUrl? }.');
    }

    const displayName = body.displayName.trim();
    if (displayName.length === 0 || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      throw badRequest(`displayName must be 1-${MAX_DISPLAY_NAME_LENGTH} characters.`);
    }
    const handle = body.handle.trim();
    if (!HANDLE_RE.test(handle)) {
      throw badRequest('handle must be 3-20 characters: lowercase letters, numbers, or underscores.');
    }
    if (body.bio.length > MAX_BIO_LENGTH) {
      throw badRequest(`bio must be at most ${MAX_BIO_LENGTH} characters.`);
    }

    const avatarUrl = parseImageField(body.avatarUrl, 'avatarUrl', viewer.avatar_url);
    const bannerUrl = parseImageField(body.bannerUrl, 'bannerUrl', viewer.banner_url);

    if (handle !== viewer.handle && (await isHandleUsedByPolymarketTrader(handle))) {
      throw new ApiError(
        409,
        'leaderboard_username_taken',
        'That username is already used by a Polymarket trader.'
      );
    }

    const supabase = getSupabase();
    const { data: updated, error } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        handle,
        bio: body.bio.trim(),
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      })
      .eq('id', viewer.id)
      .select('*')
      .single();
    if (error) {
      // Postgres unique-violation on `users.handle`.
      if (error.code === '23505') {
        throw new ApiError(409, 'handle_taken', 'That username is already taken.');
      }
      throw error;
    }

    return Response.json(await buildUserProfile(updated, viewer.id));
  });
}

/** `DELETE /users/me` removes only the authenticated caller's Knewit data.
 * Keep this on the dynamic route so `/users/me` can also use the GET and
 * PATCH handlers above; a static `users/me/route.ts` shadows them in Next. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    if (id !== 'me') {
      throw badRequest('Only the authenticated caller\'s own account ("me") can be deleted.');
    }

    const { privyUserId } = await requireAuth(request);
    const user = await getOrCreateUser(privyUserId);
    const { error } = await getSupabase().from('users').delete().eq('id', user.id);

    if (error) throw error;
    return Response.json({ deleted: true });
  });
}
