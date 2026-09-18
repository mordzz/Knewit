import type { ID, ISODateString, Category } from '@/types/common';

/** Mirrors `apps/frontend/src/types/market.ts`. Settlement is binary —
 * Polymarket resolves each token as paid (1) or not (0) — but a market
 * may offer more than two tradeable **choices** (see `MarketChoice`);
 * this type is only used for settlement outcomes. */
export type Outcome = 'YES' | 'NO';

/**
 * One selectable choice of a market, exactly in Polymarket's own
 * `outcomes` array order — `index` is the position in that array (and in
 * the parallel `clobTokenIds` array), so it is the stable identifier a
 * trade sends. `label` is display-only, straight from the API ("Yes",
 * "Manchester City", "Over", ...). See docs/DECISIONS.md
 * ("Trading Any Polymarket Choice").
 */
export interface MarketChoice {
  index: number;
  label: string;
  price: number; // cents
  imageUrl?: string | null;
}

export interface Event {
  id: ID;
  title: string;
  category: Category;
  markets: Market[];
}

export interface Market {
  id: ID;
  eventId: ID;
  question: string;
  yesPrice: number; // decimal cents, up to 4 dp (Polymarket ticks to 0.0001)
  noPrice: number; // decimal cents, up to 4 dp (Polymarket ticks to 0.0001)
  volume: number;
  liquidity: number;
  endDate: ISODateString;
  resolved: boolean;
  resolvedOutcome: Outcome | null;
}

export interface Position {
  id: ID;
  userId: ID;
  marketId: ID;
  /** The chosen choice's label, as the market's API data had it. */
  outcome: string;
  choiceIndex: number;
  entryPrice: number; // cents at time of entry
  size: number; // shares
  openedAt: ISODateString;
}

/** MVP trading is market-price buys only — no limit orders/order book. */
export interface Order {
  id: ID;
  userId: ID;
  marketId: ID;
  outcome: string;
  choiceIndex: number;
  size: number;
  price: number; // cents
  status: 'pending' | 'filled' | 'failed';
  createdAt: ISODateString;
}
