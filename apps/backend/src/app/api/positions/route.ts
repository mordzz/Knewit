import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { getCachedOrLiveMarketSummary } from '@/lib/marketCache';
import type { UserPosition } from '@/types/social';

interface PositionRow {
  id: string;
  market_id: string;
  outcome: string;
  choice_index: number;
  entry_price: number;
  size: number;
  opened_at: string;
}

/** `GET /positions` — the authenticated user's positions
 * (docs/API.md). No dev-mock fallback on the mobile side and none
 * needed here either: an empty `positions` table honestly means "no
 * positions yet" (Phase 3 trading has no verified fills — see
 * `lib/trading/orders.ts`). `currentPrice` comes from the market
 * cache/live Polymarket lookup, not the position's own stored
 * `entryPrice`, since it reflects the price *now*, not at entry. */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const { data: rows } = await getSupabase()
      .from('positions')
      .select('id, market_id, outcome, choice_index, entry_price, size, opened_at')
      .eq('user_id', viewer.id)
      .order('opened_at', { ascending: false });

    const positionRows = (rows ?? []) as PositionRow[];
    const items: UserPosition[] = await Promise.all(
      positionRows.map(async (row) => {
        const market = await getCachedOrLiveMarketSummary(row.market_id);
        return {
          id: row.id,
          marketId: row.market_id,
          marketQuestion: market?.question ?? '(market unavailable)',
          outcome: row.outcome,
          choiceIndex: row.choice_index,
          entryPrice: row.entry_price,
          currentPrice: market?.choices?.[row.choice_index]?.price ?? null,
          size: row.size,
          openedAt: row.opened_at,
        };
      })
    );

    return Response.json(items);
  });
}
