import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { CreateTradeInput, CreateTradeResult, SellPositionResponse } from '@/types/trading';

/**
 * Places a real trade against our backend — deliberately **no dev-mock
 * fallback**, unlike every read-only `*Service.ts` in this codebase.
 * Those fall back to a local fixture on failure because a mock market
 * list is harmless. A trade is a financially consequential, mutating
 * action: silently "succeeding" against a fixture when the real backend
 * is unreachable would be exactly the fabricated transaction Sprint 7's
 * spec explicitly forbids. If the backend call fails (including because
 * no backend exists yet in this environment), the error propagates and
 * the UI shows an honest "Trade failed" — see docs/DECISIONS.md.
 *
 * The backend is solely responsible for constructing the actual
 * Polymarket CLOB order and coordinating any client-side signing that
 * requires the embedded wallet (see docs/WALLET.md's signing flow) —
 * this function does not attempt to build or sign an order itself, since
 * that exact request/signing shape isn't implemented by a real backend
 * yet and this project must not invent one (see docs/DECISIONS.md,
 * "Trade Signing Not Implemented This Sprint").
 */
export async function createTrade(input: CreateTradeInput): Promise<CreateTradeResult> {
  return apiRequest<CreateTradeResult>(endpoints.tradingOrders, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Closes one whole position at market and leaves proceeds in this
 * account's trading balance. **No dev-mock fallback**,
 * same reasoning as `createTrade` — a sell that never happened must
 * never look like it did.
 */
export async function sellPosition(positionId: string): Promise<SellPositionResponse> {
  return apiRequest<SellPositionResponse>(endpoints.tradingSell, {
    method: 'POST',
    body: JSON.stringify({ positionId }),
  });
}

export interface RedeemResult {
  amountUsd: number;
  transactionHash: string | null;
}

/** Redeems a resolved market's winning shares into the trading balance. */
export async function redeemPosition(conditionId: string): Promise<RedeemResult> {
  return apiRequest<RedeemResult>(endpoints.tradingRedeem, {
    method: 'POST',
    body: JSON.stringify({ conditionId }),
  });
}
