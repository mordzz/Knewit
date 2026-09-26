import { ApiError, badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { getAndCacheMarketSummary } from '@/features/markets/lib/marketCache';
import { isRejectedBeforeSubmit, placeMarketOrder } from '@/lib/trading/orders';
import type { Order } from '@/types/market';
import { beginWalletOperation, operationInProgress, updateWalletOperation } from '@/lib/walletOperations';
import { reconcileUserWalletOperations } from '@/lib/walletReconciliation';

// Order placement signs and submits against the venue; the Vercel
// default timeout is too tight for a cold start plus relayer round trip.
export const maxDuration = 60;

interface CreateTradeOrderInput {
  marketId: string;
  /** Index into the market's own `outcomes` array  the client never
   * sends a label; the backend resolves it from the live market. */
  choiceIndex: number;
  usdAmount: number;
}

/**
 * `POST /trading/orders`  market-price BUY (docs/API.md). The wallet is resolved from the authenticated Privy
 * session, never client-supplied. A failed trade (signing rejected,
 * CLOB rejects the order, no liquidity) is recorded as a `failed`
 * `Order` row for audit history, but the HTTP response itself errors
 *  never a `200` with a silently-failed trade  per docs/DECISIONS.md,
 * "No Fake Trade Success."
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await reconcileUserWalletOperations(viewer.id).catch((error) => console.warn('[trading/orders] prior operation reconciliation incomplete:', error));

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
    const supabase = getSupabase();
    const { operation, started } = await beginWalletOperation(supabase, {
      userId: viewer.id,
      type: 'buy',
      request: { marketId: body.marketId, choiceIndex, usdAmount: body.usdAmount },
      idempotencyKey: request.headers.get('idempotency-key'),
    });
    if (!started) {
      if (operation.status === 'confirmed' && operation.result?.order) {
        return Response.json(operation.result.order);
      }
      throw operationInProgress();
    }

    let result;
    try {
      result = await placeMarketOrder({ privyUserId, marketId: body.marketId, choiceIndex, usdAmount: body.usdAmount });
    } catch (error) {
      // Rejected before anything reached the venue (bad input, not enough
      // balance/shares, approvals couldn't be set up): a plain failure, not
      // an unknown outcome  release the lock and surface the real reason.
      if (isRejectedBeforeSubmit(error)) {
        await updateWalletOperation(supabase, operation.id, { status: 'failed', error_code: error.code, reconciled_at: new Date().toISOString() });
        throw error;
      }
      await updateWalletOperation(supabase, operation.id, { status: 'reconciliation_required' });
      console.error('[trading/orders] order outcome requires backend reconciliation:', error);
      return Response.json({ code: 'trade_reconciliation_required', message: 'The trade result is being checked. Check your positions and balance before submitting another order.', status: 'reconciliation_required' }, { status: 202 });
    }
    if (result.status === 'failed') {
      await updateWalletOperation(supabase, operation.id, { status: 'failed', result: { errorMessage: result.errorMessage }, error_code: 'trade_failed' });
    } else {
      await updateWalletOperation(supabase, operation.id, {
        status: 'reconciliation_required',
        provider_order_id: result.polymarketOrderId,
        result: { marketId: body.marketId, choiceIndex, choiceLabel: result.choiceLabel, filledSize: result.filledSize, filledPrice: result.filledPrice, status: result.status },
      });
    }
    // Cache the market row first so the Order FK into `markets`
    // holds regardless of fill outcome (see lib/marketCache.ts).
    try {
      await getAndCacheMarketSummary(body.marketId);
    } catch (error) {
      if (result.status !== 'failed') {
        console.error('[trading/orders] trade executed but market cache reconciliation failed:', error);
        return Response.json({
          code: 'trade_reconciliation_required',
          message: 'The trade may have executed. Check your positions and balance before submitting another order.',
          status: 'reconciliation_required',
        }, { status: 202 });
      }
      // The trade itself was already rejected and recorded as 'failed'
      // above  a coincidental market-cache error here must not mask that
      // with a generic 500. Report the real, already-known trade failure.
      console.error('[trading/orders] market cache reconciliation also failed for an already-failed trade:', error);
      throw new ApiError(502, 'trade_failed', result.errorMessage ?? 'Trade failed.');
    }

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
        wallet_operation_id: operation.id,
      })
      .select('*')
      .single();
    if (orderError) {
      if (result.status !== 'failed') {
        console.error('[trading/orders] venue trade executed but order persistence failed:', orderError);
        return Response.json({
          code: 'trade_reconciliation_required',
          message: 'The trade may have executed. Check your positions and balance before submitting another order.',
          status: 'reconciliation_required',
        }, { status: 202 });
      }
      throw orderError;
    }

    if (result.status === 'failed') {
      await updateWalletOperation(supabase, operation.id, { status: 'failed', result: { orderId: orderRow.id }, reconciled_at: new Date().toISOString() });
      throw new ApiError(502, 'trade_failed', result.errorMessage ?? 'Trade failed.');
    }

    // Holdings aren't stored locally  `GET /positions` reads them from
    // Polymarket's Data API. The order row is the app's trade history.
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
    await updateWalletOperation(supabase, operation.id, { status: 'confirmed', result: { order }, reconciled_at: new Date().toISOString() });
    return Response.json(order, { status: 201 });
  });
}
