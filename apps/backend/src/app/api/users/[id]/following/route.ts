import { notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser, resolveTargetUserId, type DbUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { fetchPage, parseCursor } from '@/lib/pagination';
import type { Paginated } from '@/types/common';
import type { FollowListItem } from '@/types/social';

/** `GET /users/:id/following` — accounts this user follows. Mirrors
 * `followers/route.ts` with the follower/following columns swapped. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;
    const targetId = await resolveTargetUserId(id, viewer?.privyUserId ?? null);

    const supabase = getSupabase();
    const { data: target } = await supabase.from('users').select('id').eq('id', targetId).maybeSingle();
    if (!target) throw notFound(`User ${id} not found.`);

    const offset = parseCursor(url.searchParams.get('cursor'));
    const { items: followRows, nextCursor: pageCursor } = await fetchPage<{ following_id: string }>(
      supabase.from('follows').select('following_id').eq('follower_id', targetId).order('created_at', { ascending: false }),
      offset
    );

    const followingIds = followRows.map((r) => r.following_id);
    const { data: users } = followingIds.length
      ? await supabase.from('users').select('*').in('id', followingIds)
      : { data: [] as DbUser[] };
    const usersById = new Map((users ?? []).map((u) => [u.id as string, u as DbUser]));

    let viewerFollowingSet = new Set<string>();
    if (viewerUserRow && followingIds.length) {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerUserRow.id)
        .in('following_id', followingIds);
      viewerFollowingSet = new Set((data ?? []).map((r) => r.following_id as string));
    }

    const items: FollowListItem[] = followingIds
      .map((followingId) => usersById.get(followingId))
      .filter((u): u is DbUser => Boolean(u))
      .map((u) => ({
        user: { id: u.id, handle: u.handle, displayName: u.display_name, avatarUrl: u.avatar_url },
        isFollowing: viewerFollowingSet.has(u.id),
        isSelf: viewerUserRow?.id === u.id,
      }));

    const page: Paginated<FollowListItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}
