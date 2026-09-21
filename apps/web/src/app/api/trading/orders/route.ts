import { ApiError, badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { getAndCacheMarketSummary } from '@/features/markets/lib/marketCache';
import { placeMarketOrder } from '@/lib/trading/orders';
import type { Order } from '@/types/market';

// Order placement signs and submits against the venue; the Vercel
// default timeout is too tight for a cold start plus relayer round trip.
export const maxDuration = 60;

interface CreateTradeOrderInput {
  marketId: string;
  /** Index into the market's own `outcomes` array — the client never
   * sends a label; the backend resolves it from the live market. */
  choiceIndex: number;
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
    if (process.env.TRADING_ENABLED !== 'true') {
      throw new ApiError(503, 'trading_unavailable', 'Trading is temporarily unavailable.');
    }
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<CreateTradeOrderInput> | null;
    if (
      !body ||
      typeof body.marketId !== 'string' ||
      !Number.isInteger(body.choiceIndex) ||
      (body.choiceIndex as number) < 0 ||
      typeof body.usdAmount !== 'number' ||
      body.usdAmount <= 0
    ) {
      throw badRequest('Expected { marketId: string, choiceIndex: integer >= 0, usdAmount: number > 0 }.');
    }

    const choiceIndex = body.choiceIndex as number;

    const result = await placeMarketOrder({
      privyUserId,
      marketId: body.marketId,
      choiceIndex,
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
        outcome: result.choiceLabel,
        choice_index: choiceIndex,
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
      outcome: result.choiceLabel,
      choice_index: choiceIndex,
      entry_price: result.filledPrice,
      size: result.filledSize,
    });
    if (positionError) throw positionError;

    const order: Order = {
      id: orderRow.id,
      userId: orderRow.user_id,
      marketId: orderRow.market_id,
      outcome: orderRow.outcome,
      choiceIndex: orderRow.choice_index,
      size: orderRow.size,
      price: orderRow.price,
      status: orderRow.status,
      createdAt: orderRow.created_at,
    };
    return Response.json(order, { status: 201 });
  });
}
