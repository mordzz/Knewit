import { notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser, resolveTargetUserId } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { DEFAULT_PAGE_SIZE, nextCursor, parseCursor } from '@/lib/pagination';
import type { Paginated } from '@/types/common';
import type { FollowListItem } from '@/types/social';

interface FollowListRow {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_following: boolean;
  is_self: boolean;
}

/** `GET /users/:id/following` — accounts this user follows. Mirrors
 * `followers/route.ts` with `p_direction: 'following'`; both use the one
 * `user_follow_list` query (migration `0010_single_query_reads.sql`). */
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
    const { data, error } = await supabase.rpc('user_follow_list', {
      p_target_id: targetId,
      p_viewer_id: viewerUserRow?.id ?? null,
      p_direction: 'following',
      // One extra row: `nextCursor` needs to know whether more exist.
      p_limit: DEFAULT_PAGE_SIZE + 1,
      p_offset: offset,
    });
    if (error) throw error;

    const rows = (data ?? []) as FollowListRow[];
    const items: FollowListItem[] = rows.slice(0, DEFAULT_PAGE_SIZE).map((row) => ({
      user: {
        id: row.id,
        handle: row.handle,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
      isFollowing: row.is_following,
      isSelf: row.is_self,
    }));

    const page: Paginated<FollowListItem> = {
      items,
      nextCursor: nextCursor(offset, rows.length, DEFAULT_PAGE_SIZE),
    };
    return Response.json(page);
  });
}
