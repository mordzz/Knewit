import type { ID } from '@/types/common';
import type { Order } from '@/types/market';

/** `choiceIndex` is the index into the market's own `outcomes` array —
 * the label is never sent by the client; the backend resolves it from
 * the live market. */
export interface CreateTradeInput {
  marketId: ID;
  choiceIndex: number;
  usdAmount: number;
}

export type CreateTradeResult = Order;

/** `POST /trading/sell` — closes one whole position at market and sends
 * the proceeds from the trading wallet back to the caller's Privy
 * embedded wallet. `cashOut.status: 'failed'` still means the sell
 * succeeded: the money is in the user's own trading wallet, not lost. */
export interface SellPositionResponse {
  order: Order;
  cashOut: {
    status: 'sent' | 'failed';
    amountUsd: number;
    error: string | null;
  };
}

/** Live order-book estimate for a market BUY of `usdAmount` —
 * `GET /markets/:id/trade-estimate`. `estimatedPrice` is cents,
 * `estimatedShares` is shares (both 2dp). */
export interface TradeEstimate {
  estimatedPrice: number;
  estimatedShares: number;
}
