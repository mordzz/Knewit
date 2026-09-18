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

/** Closes one whole position at market; the backend also sends the
 * proceeds to this account's Privy wallet. No dev-mock fallback, same
 * reasoning as `createTrade`. */
export async function sellPosition(positionId: string): Promise<SellPositionResponse> {
  return apiRequest<SellPositionResponse>('/api/trading/sell', {
    method: 'POST',
    body: JSON.stringify({ positionId }),
  });
}
