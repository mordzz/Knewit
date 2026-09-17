import { notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { resolveTargetUserId } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { DEFAULT_PAGE_SIZE, parseCursor } from '@/lib/pagination';
import type { Paginated } from '@/types/common';
import type { ActivityItem } from '@/types/activity';

interface ActivityRow {
  id: string;
  type: 'TRADE' | 'CALL' | 'FOLLOW';
  created_at: string;
  market_id: string | null;
  market_question: string | null;
  outcome: string | null;
  choice_index: number | null;
  usd_amount: number | null;
  post_id: string | null;
  followed_user_id: string | null;
}

/** `GET /users/:id/activity` — union of TRADE/CALL/FOLLOW events
 * (docs/API.md; see `supabase/migrations/0003_user_activity.sql` for
 * the query). Every row here reflects a completed server-side action
 * (a filled Order, a stored Call/Follow row) — never a client's
 * optimistic assumption. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const viewer = await optionalAuth(request);
    const targetId = await resolveTargetUserId(id, viewer?.privyUserId ?? null);

    const supabase = getSupabase();
    const { data: target } = await supabase.from('users').select('id').eq('id', targetId).maybeSingle();
    if (!target) throw notFound(`User ${id} not found.`);

    const offset = parseCursor(url.searchParams.get('cursor'));
    const { data, error } = await supabase.rpc('user_activity', {
      p_user_id: targetId,
      p_limit: DEFAULT_PAGE_SIZE + 1,
      p_offset: offset,
    });
    if (error) throw error;

    const rows = (data ?? []) as ActivityRow[];
    const pageRows = rows.slice(0, DEFAULT_PAGE_SIZE);
    const nextCursor = rows.length > DEFAULT_PAGE_SIZE ? String(offset + DEFAULT_PAGE_SIZE) : null;

    const followedUserIds = Array.from(
      new Set(pageRows.filter((r) => r.type === 'FOLLOW' && r.followed_user_id).map((r) => r.followed_user_id!))
    );
    const { data: followedUsers } = followedUserIds.length
      ? await supabase.from('users').select('id, handle, display_name').in('id', followedUserIds)
      : { data: [] as Array<{ id: string; handle: string; display_name: string }> };
    const followedById = new Map((followedUsers ?? []).map((u) => [u.id, u]));

    const items: ActivityItem[] = pageRows.flatMap((row): ActivityItem[] => {
      switch (row.type) {
        case 'TRADE':
          if (!row.market_id || !row.outcome || row.usd_amount === null) return [];
          return [
            {
              id: row.id,
              type: 'TRADE',
              createdAt: row.created_at,
              marketId: row.market_id,
              marketQuestion: row.market_question ?? '(market unavailable)',
              outcome: row.outcome,
              choiceIndex: row.choice_index ?? 0,
              usdAmount: row.usd_amount,
            },
          ];
        case 'CALL':
          if (!row.post_id || !row.outcome) return [];
          return [
            {
              id: row.id,
              type: 'CALL',
              createdAt: row.created_at,
              postId: row.post_id,
              marketQuestion: row.market_question ?? '(market unavailable)',
              outcome: row.outcome,
              choiceIndex: row.choice_index ?? 0,
            },
          ];
        case 'FOLLOW': {
          const followedUser = row.followed_user_id ? followedById.get(row.followed_user_id) : undefined;
          if (!followedUser) return [];
          return [
            {
              id: row.id,
              type: 'FOLLOW',
              createdAt: row.created_at,
              followedUser: { id: followedUser.id, handle: followedUser.handle, displayName: followedUser.display_name },
            },
          ];
        }
        default:
          return [];
      }
    });

    const page: Paginated<ActivityItem> = { items, nextCursor };
    return Response.json(page);
  });
}
