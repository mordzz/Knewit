import { badRequest, notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth, requireAuth } from '@/lib/privy';
import { getOrCreateUser, resolveTargetUserId } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { buildUserProfile } from '@/lib/social';
import type { UpdateProfileInput } from '@/types/social';

/** `GET /users/:id` — `:id` accepts the literal `"me"` (docs/API.md).
 * Public read: an unauthenticated caller gets `isFollowing: false`,
 * `isSelf: false` (see `buildUserProfile`), never a 401. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const targetId = await resolveTargetUserId(id, viewer?.privyUserId ?? null);
    const supabase = getSupabase();
    const { data: target } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (!target) {
      throw notFound(`User ${id} not found.`);
    }

    return Response.json(await buildUserProfile(target, viewerUserRow?.id ?? null));
  });
}

/** `PATCH /users/me` — the only mutable profile route; `:id` must be
 * the literal `"me"` (docs/API.md, "Edit Profile Scope" — no
 * `PATCH /users/:id` for anyone else). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    if (id !== 'me') {
      throw badRequest('Only the authenticated caller\'s own profile ("me") can be edited.');
    }

    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<UpdateProfileInput> | null;
    if (!body || typeof body.displayName !== 'string' || typeof body.bio !== 'string') {
      throw badRequest('Expected { displayName: string, bio: string }.');
    }
    if (body.displayName.trim().length === 0) {
      throw badRequest('displayName must not be empty.');
    }

    const supabase = getSupabase();
    const { data: updated, error } = await supabase
      .from('users')
      .update({ display_name: body.displayName, bio: body.bio })
      .eq('id', viewer.id)
      .select('*')
      .single();
    if (error) throw error;

    return Response.json(await buildUserProfile(updated, viewer.id));
  });
}
