import { notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser, resolveTargetUserId, type DbUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { fetchPage, parseCursor } from '@/lib/pagination';
import type { Paginated } from '@/types/common';
import type { FollowListItem } from '@/types/social';

/** `GET /users/:id/followers` — accounts following this user. */
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
    const { items: followRows, nextCursor: pageCursor } = await fetchPage<{ follower_id: string }>(
      supabase.from('follows').select('follower_id').eq('following_id', targetId).order('created_at', { ascending: false }),
      offset
    );

    const followerIds = followRows.map((r) => r.follower_id);
    const { data: users } = followerIds.length
      ? await supabase.from('users').select('*').in('id', followerIds)
      : { data: [] as DbUser[] };
    const usersById = new Map((users ?? []).map((u) => [u.id as string, u as DbUser]));

    let followingSet = new Set<string>();
    if (viewerUserRow && followerIds.length) {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerUserRow.id)
        .in('following_id', followerIds);
      followingSet = new Set((data ?? []).map((r) => r.following_id as string));
    }

    const items: FollowListItem[] = followerIds
      .map((followerId) => usersById.get(followerId))
      .filter((u): u is DbUser => Boolean(u))
      .map((u) => ({
        user: { id: u.id, handle: u.handle, displayName: u.display_name, avatarUrl: u.avatar_url },
        isFollowing: followingSet.has(u.id),
        isSelf: viewerUserRow?.id === u.id,
      }));

    const page: Paginated<FollowListItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}
