import { ApiError, badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { getAndCacheMarketSummary } from '@/lib/marketCache';
import { placeMarketOrder } from '@/lib/trading/orders';
import type { Order, Outcome } from '@/types/market';

interface CreateTradeOrderInput {
  marketId: string;
  outcome: Outcome;
  usdAmount: number;
}

/**
 * `POST /trading/orders` — market-price BUY only (docs/API.md,
 * docs/PRD.md). The wallet is resolved from the authenticated Privy
 * session, never client-supplied. A failed trade (signing rejected,
 * CLOB rejects the order, no liquidity) is recorded as a `failed`
 * `Order` row for audit history, but the HTTP response itself errors
 * — never a `200` with a silently-failed trade — per docs/DECISIONS.md,
 * "No Fake Trade Success."
 *
 * **Not verified against a real fill** — see
 * `src/lib/trading/orders.ts`'s doc comment.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<CreateTradeOrderInput> | null;
    if (
      !body ||
      typeof body.marketId !== 'string' ||
      (body.outcome !== 'YES' && body.outcome !== 'NO') ||
      typeof body.usdAmount !== 'number' ||
      body.usdAmount <= 0
    ) {
      throw badRequest('Expected { marketId: string, outcome: "YES" | "NO", usdAmount: number > 0 }.');
    }

    const result = await placeMarketOrder({
      privyUserId,
      marketId: body.marketId,
      outcome: body.outcome,
      usdAmount: body.usdAmount,
    });

    const supabase = getSupabase();
    // Cache the market row first so the Order/Position FK into `markets`
    // holds regardless of fill outcome (see lib/marketCache.ts).
    await getAndCacheMarketSummary(body.marketId);

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: viewer.id,
        market_id: body.marketId,
        outcome: body.outcome,
        size: result.filledSize,
        price: result.filledPrice,
        status: result.status,
      })
      .select('*')
      .single();
    if (orderError) throw orderError;

    if (result.status === 'failed') {
      throw new ApiError(502, 'trade_failed', result.errorMessage ?? 'Trade failed.');
    }

    const { error: positionError } = await supabase.from('positions').insert({
      user_id: viewer.id,
      market_id: body.marketId,
      outcome: body.outcome,
      entry_price: result.filledPrice,
      size: result.filledSize,
    });
    if (positionError) throw positionError;

    const order: Order = {
      id: orderRow.id,
      userId: orderRow.user_id,
      marketId: orderRow.market_id,
      outcome: orderRow.outcome,
      size: orderRow.size,
      price: orderRow.price,
      status: orderRow.status,
      createdAt: orderRow.created_at,
    };
    return Response.json(order, { status: 201 });
  });
}
