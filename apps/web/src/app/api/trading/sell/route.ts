import { ApiError, badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { isRejectedBeforeSubmit, sellMarketPosition } from '@/lib/trading/orders';
import { getAndCacheMarketSummary } from '@/features/markets/lib/marketCache';
import type { Order } from '@/types/market';
import type { SellPositionResponse } from '@/types/trading';
import { beginWalletOperation, operationInProgress, updateWalletOperation } from '@/lib/walletOperations';
import { reconcileUserWalletOperations } from '@/lib/walletReconciliation';

// Covers cold start and order execution on Vercel (the Hobby plan's maximum).
export const maxDuration = 60;

interface SellPositionInput {
  /** The position's outcome token id (`UserPosition.id`). What's sold is
   * whatever the caller's own Deposit Wallet holds of it. */
  positionId: string;
}

/**
 * `POST /trading/sell` — market-price SELL of one whole position. Proceeds
 * stay in the caller's Polymarket Deposit Wallet for future trading or
 * withdrawal. The wallet and the position's ownership are resolved
 * from the authenticated session, never from the client.
 *
 * A failed sell is recorded as a `failed` Order row for audit history
 * and answered as a real error — never a `200` with a silently-failed
 * trade ("No Fake Trade Success").
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await reconcileUserWalletOperations(viewer.id).catch((error) => console.warn('[trading/sell] prior operation reconciliation incomplete:', error));

    const body = (await request.json().catch(() => null)) as Partial<SellPositionInput> | null;
    if (!body || typeof body.positionId !== 'string' || body.positionId.length === 0) {
      throw badRequest('Expected { positionId: string }.');
    }

    const supabase = getSupabase();
    const { operation, started } = await beginWalletOperation(supabase, {
      userId: viewer.id,
      type: 'sell',
      request: { positionId: body.positionId },
      idempotencyKey: request.headers.get('idempotency-key'),
    });
    if (!started) {
      if (operation.status === 'confirmed' && operation.result?.response) {
        return Response.json(operation.result.response);
      }
      throw operationInProgress();
    }

    let result;
    try {
      result = await sellMarketPosition({ privyUserId, positionId: body.positionId });
    } catch (error) {
      // Rejected before anything reached the venue (bad input, not enough
      // balance/shares, approvals couldn't be set up): a plain failure, not
      // an unknown outcome — release the lock and surface the real reason.
      if (isRejectedBeforeSubmit(error)) {
        await updateWalletOperation(supabase, operation.id, { status: 'failed', error_code: error.code, reconciled_at: new Date().toISOString() });
        throw error;
      }
      await updateWalletOperation(supabase, operation.id, { status: 'reconciliation_required' });
      console.error('[trading/sell] sell outcome requires backend reconciliation:', error);
      return Response.json({ code: 'trade_reconciliation_required', message: 'The sell result is being checked. Check your positions and balance before trying again.', status: 'reconciliation_required' }, { status: 202 });
    }
    if (result.status === 'failed') {
      await updateWalletOperation(supabase, operation.id, { status: 'failed', result: { errorMessage: result.errorMessage }, error_code: 'trade_failed' });
    } else {
      await updateWalletOperation(supabase, operation.id, {
        status: 'reconciliation_required',
        provider_order_id: result.polymarketOrderId,
        result: { positionId: body.positionId, marketId: result.marketId, choiceIndex: result.choiceIndex, choiceLabel: result.choiceLabel, soldShares: result.soldShares, remainingShares: result.remainingShares, filledPrice: result.filledPrice, proceedsUsd: result.proceedsUsd, status: result.status },
      });
    }
    // The order row's FK needs the market cached.
    await getAndCacheMarketSummary(result.marketId).catch((error) =>
      console.warn('[trading/sell] market cache refresh failed:', error)
    );
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
        wallet_operation_id: operation.id,
      })
      .select('*')
      .single();
    if (orderError) {
      if (result.status !== 'failed') {
        console.error('[trading/sell] venue sell executed but order persistence failed:', orderError);
        return Response.json({
          code: 'trade_reconciliation_required',
          message: 'The sell may have executed. Check your positions and balance before trying again.',
          status: 'reconciliation_required',
        }, { status: 202 });
      }
      throw orderError;
    }

    if (result.status === 'failed') {
      await updateWalletOperation(supabase, operation.id, { status: 'failed', result: { orderId: orderRow.id }, reconciled_at: new Date().toISOString() });
      throw new ApiError(502, 'trade_failed', result.errorMessage ?? 'Sell failed.');
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
      proceedsUsd: result.proceedsUsd,
    };
    await updateWalletOperation(supabase, operation.id, { status: 'confirmed', result: { response }, reconciled_at: new Date().toISOString() });
    return Response.json(response);
  });
}
