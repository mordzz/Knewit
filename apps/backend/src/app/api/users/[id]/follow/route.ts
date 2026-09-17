import { badRequest, notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser, resolveTargetUserId } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import type { FollowResult } from '@/types/social';

async function followerCount(targetId: string): Promise<number> {
  const supabase = getSupabase();
  const { count } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', targetId);
  return count ?? 0;
}

/** `POST /users/:id/follow` — the follower is always the authenticated
 * caller, never client-supplied; `followerId === followingId` is
 * rejected here *and* by the DB's `follows_no_self_follow` check
 * constraint (docs/DATABASE.md — belt and suspenders). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    const targetId = await resolveTargetUserId(id, privyUserId);

    if (targetId === viewer.id) {
      throw badRequest('Cannot follow yourself.');
    }

    const supabase = getSupabase();
    const { data: target } = await supabase.from('users').select('id').eq('id', targetId).maybeSingle();
    if (!target) throw notFound(`User ${id} not found.`);

    const { error } = await supabase
      .from('follows')
      .upsert({ follower_id: viewer.id, following_id: targetId }, { onConflict: 'follower_id,following_id' });
    if (error) throw error;

    const result: FollowResult = { following: true, followerCount: await followerCount(targetId) };
    return Response.json(result);
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    const targetId = await resolveTargetUserId(id, privyUserId);

    const supabase = getSupabase();
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', viewer.id)
      .eq('following_id', targetId);
    if (error) throw error;

    const result: FollowResult = { following: false, followerCount: await followerCount(targetId) };
    return Response.json(result);
  });
}
