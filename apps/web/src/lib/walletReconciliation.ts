import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { getAndCacheMarketSummary } from '@/features/markets/lib/marketCache';
import type { WalletOperation } from '@/lib/walletOperations';

const chainClient = createPublicClient({ chain: polygon, transport: http(env.polygonRpcUrl) });
/** A trade with no recorded venue answer after this long is released. */
const UNKNOWN_TRADE_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Best-effort server-side reconciliation for one account. It is invoked by
 * authenticated backend reads/actions; no operation state is polled or
 * persisted in the client. Unknown outcomes remain locked for review and
 * are never resubmitted automatically.
 */
export async function reconcileUserWalletOperations(userId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from('wallet_operations')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['submitted', 'reconciliation_required'])
    .order('updated_at', { ascending: true })
    .limit(20);
  if (error) throw error;

  for (const raw of rows ?? []) {
    const operation = raw as WalletOperation;
    try {
      if (operation.transaction_hash) {
        let receipt;
        try {
          receipt = await chainClient.getTransactionReceipt({ hash: operation.transaction_hash as `0x${string}` });
        } catch {
          continue; // Not mined yet, or this RPC has not indexed it.
        }
        if (receipt.status === 'success') {
          const amountRaw = operation.request.amount;
          const result = operation.operation_type === 'withdraw'
            ? { status: 'confirmed', amountUsdc: Number(amountRaw ?? 0) / 1e6, transactionHash: receipt.transactionHash, transactionId: operation.transaction_id }
            : { ...(operation.result ?? {}), transactionHash: receipt.transactionHash };
          await updateOperation(supabase, operation.id, { status: 'confirmed', result, reconciled_at: new Date().toISOString() });
        } else {
          await updateOperation(supabase, operation.id, { status: 'failed', error_code: 'transaction_reverted', reconciled_at: new Date().toISOString() });
        }
        continue;
      }

      if ((operation.operation_type === 'buy' || operation.operation_type === 'sell') && operation.result) {
        await reconcileTradeRows(supabase, operation);
      } else if (
        (operation.operation_type === 'buy' || operation.operation_type === 'sell') &&
        Date.now() - new Date(operation.updated_at).getTime() > UNKNOWN_TRADE_EXPIRY_MS
      ) {
        // The request died before the venue answered. Holdings are read
        // live from Polymarket, so the portfolio already shows whether it
        // filled; release the lock instead of blocking trading forever.
        await updateOperation(supabase, operation.id, { status: 'failed', error_code: 'outcome_unknown', reconciled_at: new Date().toISOString() });
      }
    } catch (reconcileError) {
      console.error('[wallet/reconcile] operation remains unresolved:', { operationId: operation.id, type: operation.operation_type, error: reconcileError });
      await updateOperation(supabase, operation.id, { attempts: (operation.attempts ?? 0) + 1 });
    }
  }
}

async function reconcileTradeRows(supabase: ReturnType<typeof getSupabase>, operation: WalletOperation) {
  const result = operation.result!;
  const marketId = String(result.marketId ?? '');
  if (!marketId) return;
  await getAndCacheMarketSummary(marketId);

  let { data: order } = await supabase.from('orders').select('*').eq('wallet_operation_id', operation.id).maybeSingle();
  if (!order) {
    const isBuy = operation.operation_type === 'buy';
    const { data, error } = await supabase.from('orders').insert({
      wallet_operation_id: operation.id,
      user_id: operation.user_id,
      market_id: marketId,
      outcome: String(result.choiceLabel ?? ''),
      choice_index: Number(result.choiceIndex ?? 0),
      size: Number(isBuy ? result.filledSize : result.soldShares),
      price: Number(result.filledPrice ?? 0),
      status: 'filled',
    }).select('*').single();
    if (error) throw error;
    order = data;
  }

  const orderResult = {
    id: order.id,
    userId: order.user_id,
    marketId: order.market_id,
    outcome: order.outcome,
    choiceIndex: order.choice_index,
    size: order.size,
    price: order.price,
    status: order.status,
    createdAt: order.created_at,
  };
  const finalResult = operation.operation_type === 'buy'
    ? { order: orderResult }
    : { response: { order: orderResult, proceedsUsd: Number(result.proceedsUsd ?? 0) } };
  await updateOperation(supabase, operation.id, { status: 'confirmed', result: finalResult, reconciled_at: new Date().toISOString() });
}

async function updateOperation(supabase: ReturnType<typeof getSupabase>, id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from('wallet_operations').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
