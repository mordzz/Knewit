import type { ID } from '@/types/common';
import type { Order } from '@/types/market';

/** Mirrors `apps/mobile/src/types/trading.ts`. */
export type TradeStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'success' | 'failed';

/** `choiceIndex` is the index into the market's own `outcomes` array —
 * the label is never sent by the client; the backend resolves it from
 * the live market. */
export interface CreateTradeInput {
  marketId: ID;
  choiceIndex: number;
  usdAmount: number;
}

export type CreateTradeResult = Order;
