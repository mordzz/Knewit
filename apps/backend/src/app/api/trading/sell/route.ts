import { ApiError, badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { sellMarketPosition } from '@/lib/trading/orders';
import type { Order } from '@/types/market';
import type { SellPositionResponse } from '@/types/trading';

interface SellPositionInput {
  /** The `positions` row to close — ownership is re-verified server-side. */
  positionId: string;
}

/**
 * `POST /trading/sell` — market-price SELL of one whole position and a
 * cash-out of the proceeds to the caller's Privy wallet
 * (docs/API.md; docs/DECISIONS.md, "Selling a Position Cashes Out to the
 * Privy Wallet"). The wallet and the position's ownership are resolved
 * from the authenticated session, never from the client.
 *
 * A failed sell is recorded as a `failed` Order row for audit history
 * and answered as a real error — never a `200` with a silently-failed
 * trade ("No Fake Trade Success"). A sell that fills but whose cash-out
 * transfer fails is still a success: the proceeds are in the user's own
 * trading wallet, and the response carries
 * `cashOut.status: 'failed'` so the client can say so honestly.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<SellPositionInput> | null;
    if (!body || typeof body.positionId !== 'string' || body.positionId.length === 0) {
      throw badRequest('Expected { positionId: string }.');
    }

    const result = await sellMarketPosition({ privyUserId, positionId: body.positionId });

    const supabase = getSupabase();
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: viewer.id,
        market_id: result.marketId,
        outcome: result.choiceLabel,
        choice_index: result.choiceIndex,
        size: result.soldShares,
        price: result.filledPrice,
        status: result.status,
      })
      .select('*')
      .single();
    if (orderError) throw orderError;

    if (result.status === 'failed') {
      throw new ApiError(502, 'trade_failed', result.errorMessage ?? 'Sell failed.');
    }

    // Full-position sell: the row is gone once its shares are sold. The
    // sell already happened on the venue, so a cleanup failure is logged
    // rather than answered as a failed sell — the preflight on a later
    // sell would catch the stale row anyway.
    const { error: deleteError } = await supabase
      .from('positions')
      .delete()
      .eq('id', body.positionId)
      .eq('user_id', viewer.id);
    if (deleteError) {
      console.error('[trading/sell] sold position row could not be deleted:', deleteError);
    }

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

    const response: SellPositionResponse = {
      order,
      cashOut: result.cashOut ?? { status: 'failed', amountUsd: 0, error: null },
    };
    return Response.json(response);
  });
}
