import type { ID } from '@/types/common';
import type { Order } from '@/types/market';

/** What the mobile app sends to request a trade  the authenticated
 * wallet/user is resolved server-side from the request's Privy session
 * token (see `services/api/client.ts`), not passed explicitly here.
 * `choiceIndex` indexes the market's own `outcomes` array; the label is
 * never sent  the backend resolves it from the live market. */
export interface CreateTradeInput {
  marketId: ID;
  choiceIndex: number;
  usdAmount: number;
}

export type CreateTradeResult = Order;

/** `POST /trading/sell`  closes one whole position at market. Proceeds
 * stay in the user's Polymarket Deposit Wallet for future trading or
 * withdrawal. */
export interface SellPositionResponse {
  order: Order;
  proceedsUsd: number;
}

/** Live order-book estimate for a market BUY of `usdAmount`
 * `GET /markets/:id/trade-estimate`. `estimatedPrice` is cents,
 * `estimatedShares` is shares (both 2dp). */
export interface TradeEstimate {
  estimatedPrice: number;
  estimatedShares: number;
}
