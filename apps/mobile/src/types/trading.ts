import type { ID } from '@/types/common';
import type { Order } from '@/types/market';

/**
 * Client-side trade UX state — distinct from `Order.status`
 * (`types/market.ts`), which is the persisted backend order record's
 * status. `signing`/`pending` exist here for when a real backend hands
 * back an unsigned order for the embedded wallet to countersign, but
 * this sprint never reaches them — no backend exists to construct that
 * order, and inventing its shape would fabricate a signing flow this
 * project explicitly must not guess at. See docs/DECISIONS.md ("Trade
 * Signing Not Implemented This Sprint").
 */
export type TradeStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'success' | 'failed';

/** What the mobile app sends to request a trade — the authenticated
 * wallet/user is resolved server-side from the request's Privy session
 * token (see `services/api/client.ts`), not passed explicitly here.
 * `choiceIndex` indexes the market's own `outcomes` array; the label is
 * never sent — the backend resolves it from the live market. */
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
