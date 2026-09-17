import type { ID } from '@/types/common';
import type { Outcome, Order } from '@/types/market';

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
 * token (see `services/api/client.ts`), not passed explicitly here. */
export interface CreateTradeInput {
  marketId: ID;
  outcome: Outcome;
  usdAmount: number;
}

export type CreateTradeResult = Order;
