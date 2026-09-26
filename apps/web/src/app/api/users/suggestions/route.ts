import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { nextCursor, parseCursor } from '@/lib/pagination';
import type { Paginated } from '@/types/common';
import type { FollowListItem } from '@/types/social';

/** Page size for the tablet/desktop "Who to follow" rail  deliberately
 * smaller than `DEFAULT_PAGE_SIZE`: the rail shows five and expands in
 * fives via "Show more". */
const RAIL_PAGE_SIZE = 5;

interface SuggestionRow {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
}

/**
 * `GET /users/suggestions?cursor=`  follow suggestions for the
 * authenticated caller: **Knewit accounts only** (never Polymarket
 * traders, who have no profile or follow relationship here  see
 * docs/DECISIONS.md, "Round 6"), excluding the caller and anyone they
 * already follow, most-followed first. Backed by the
 * `user_follow_suggestions` SQL function (migration
 * `0009_follow_suggestions.sql`)  one query, no per-user count round
 * trips. Returns `Paginated<FollowListItem>`; `isFollowing`/`isSelf` are
 * `false` by construction, so both clients reuse `FollowListRow`
 * unchanged. A viewer who follows everyone gets an honestly empty page.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const offset = parseCursor(new URL(request.url).searchParams.get('cursor'));
    const { data, error } = await getSupabase().rpc('user_follow_suggestions', {
      p_user_id: viewer.id,
      // One extra row: `nextCursor` needs to know whether more exist.
      p_limit: RAIL_PAGE_SIZE + 1,
      p_offset: offset,
    });
    if (error) throw error;

    const rows = (data ?? []) as SuggestionRow[];
    const items: FollowListItem[] = rows.slice(0, RAIL_PAGE_SIZE).map((row) => ({
      user: {
        id: row.id,
        handle: row.handle,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
      isFollowing: false,
      isSelf: false,
    }));

    const page: Paginated<FollowListItem> = {
      items,
      nextCursor: nextCursor(offset, rows.length, RAIL_PAGE_SIZE),
    };
    return Response.json(page);
  });
}
