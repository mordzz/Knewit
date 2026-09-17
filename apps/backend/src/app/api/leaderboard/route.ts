import { unauthorized, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { parseCursor, DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import type { LeaderboardEntry, LeaderboardPage, LeaderboardScope } from '@/types/leaderboard';

interface RankingRow {
  user_id: string;
  volume: number;
  rank: number;
}

/**
 * `GET /leaderboard?scope=global|following` — ranked by trading
 * volume only, never PnL (docs/DATABASE.md/DECISIONS.md). No
 * dev-mock-fallback equivalent needed here (there's no fallback path
 * on this side): `Order` has no rows until a trade actually fills
 * (Phase 3's trading flow is unverified — see
 * `lib/trading/orders.ts`), so an empty leaderboard is the honest
 * current state, not a bug.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);
    const scope = (url.searchParams.get('scope') ?? 'global') as LeaderboardScope;

    const viewerAuth = await optionalAuth(request);
    const viewer = viewerAuth ? await getOrCreateUser(viewerAuth.privyUserId) : null;

    if (scope === 'following' && !viewer) {
      throw unauthorized('scope=following requires authentication.');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('leaderboard_ranking', {
      p_follower_id: scope === 'following' ? viewer!.id : null,
    });
    if (error) throw error;

    const ranking = (data ?? []) as RankingRow[];
    const offset = parseCursor(url.searchParams.get('cursor'));
    const pageRows = ranking.slice(offset, offset + DEFAULT_PAGE_SIZE);
    const nextCursor = offset + DEFAULT_PAGE_SIZE < ranking.length ? String(offset + DEFAULT_PAGE_SIZE) : null;

    const userIds = pageRows.map((r) => r.user_id);
    const { data: userRows } = userIds.length
      ? await supabase.from('users').select('id, handle, display_name, avatar_url').in('id', userIds)
      : { data: [] as Array<{ id: string; handle: string; display_name: string; avatar_url: string | null }> };
    const usersById = new Map((userRows ?? []).map((u) => [u.id, u]));

    let followingSet = new Set<string>();
    if (viewer && userIds.length) {
      const { data: followRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewer.id)
        .in('following_id', userIds);
      followingSet = new Set((followRows ?? []).map((r) => r.following_id as string));
    }

    const items: LeaderboardEntry[] = pageRows
      .map((row) => {
        const user = usersById.get(row.user_id);
        if (!user) return null;
        return {
          rank: row.rank,
          user: { id: user.id, handle: user.handle, displayName: user.display_name, avatarUrl: user.avatar_url },
          metric: { name: 'volume' as const, value: row.volume },
          isFollowing: followingSet.has(row.user_id),
          isSelf: viewer?.id === row.user_id,
        };
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null);

    let currentUser: LeaderboardPage['currentUser'] = null;
    if (offset === 0 && viewer) {
      const selfRow = ranking.find((r) => r.user_id === viewer.id);
      if (selfRow) {
        currentUser = { rank: selfRow.rank, metric: { name: 'volume', value: selfRow.volume } };
      }
    }

    const page: LeaderboardPage = { items, nextCursor, currentUser };
    return Response.json(page);
  });
}
