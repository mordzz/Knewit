import { notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { getCachedOrLiveMarketSummary } from '@/lib/marketCache';
import type { UserPosition } from '@/types/social';

/** `GET /positions/:marketId` — the authenticated user's position in
 * one market, or 404 if none (docs/API.md). If the user has taken
 * multiple fills in the same market/outcome (Phase 3 doesn't merge
 * them into one row — see `trading/orders/route.ts`), this returns
 * the most recent one; there's no documented "merge" semantics to
 * build against yet. */
export async function GET(request: Request, { params }: { params: Promise<{ marketId: string }> }) {
  return withErrorHandling(async () => {
    const { marketId } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const { data: row } = await getSupabase()
      .from('positions')
      .select('id, market_id, outcome, choice_index, entry_price, size, opened_at')
      .eq('user_id', viewer.id)
      .eq('market_id', marketId)
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw notFound(`No position for market ${marketId}.`);

    const market = await getCachedOrLiveMarketSummary(row.market_id);
    const position: UserPosition = {
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
    return Response.json(position);
  });
}
