import type { ID } from '@/types/common';
import type { Outcome, Order } from '@/types/market';

/** Mirrors `apps/mobile/src/types/trading.ts`. */
export type TradeStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'success' | 'failed';

export interface CreateTradeInput {
  marketId: ID;
  outcome: Outcome;
  usdAmount: number;
}

export type CreateTradeResult = Order;
