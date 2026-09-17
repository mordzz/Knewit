import type { ID, ISODateString, Category } from '@/types/common';

/** Mirrors `apps/frontend/src/types/market.ts`. MVP supports binary
 * markets only — see docs/PRD.md. */
export type Outcome = 'YES' | 'NO';

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
  yesPrice: number; // cents, 1-99
  noPrice: number; // cents, 1-99
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
  outcome: Outcome;
  entryPrice: number; // cents at time of entry
  size: number; // shares
  openedAt: ISODateString;
}

/** MVP trading is market-price buys only — no limit orders/order book. */
export interface Order {
  id: ID;
  userId: ID;
  marketId: ID;
  outcome: Outcome;
  size: number;
  price: number; // cents
  status: 'pending' | 'filled' | 'failed';
  createdAt: ISODateString;
}
