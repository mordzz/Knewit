import { apiRequest } from '@/lib/apiClient';
import type { CreateTradeInput, CreateTradeResult } from '@/types/trading';

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
