import { apiRequest } from '@/lib/apiClient';
import type { CreateTradeInput, CreateTradeResult, SellPositionResponse } from '@/types/trading';

/** Web equivalent of `apps/mobile/src/features/markets/services/tradingService.ts`
 * — no dev-mock fallback: a trade is a financially consequential,
 * mutating action, so a failure propagates as a real "Trade failed."
 */
export async function createTrade(input: CreateTradeInput): Promise<CreateTradeResult> {
  return apiRequest<CreateTradeResult>('/api/trading/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Closes one whole position at market and leaves proceeds in the user's
 * trading balance. No dev-mock fallback, same reasoning as `createTrade`. */
export async function sellPosition(positionId: string): Promise<SellPositionResponse> {
  return apiRequest<SellPositionResponse>('/api/trading/sell', {
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
  return apiRequest<RedeemResult>('/api/trading/redeem', {
    method: 'POST',
    body: JSON.stringify({ conditionId }),
  });
}
