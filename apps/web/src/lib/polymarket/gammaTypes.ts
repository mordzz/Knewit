/** Partial shapes of Polymarket's Gamma API responses  only the
 * fields this backend actually reads. Verified against the live API
 * (https://gamma-api.polymarket.com) while building this integration;
 * re-verify against https://docs.polymarket.com/ before relying on any
 * field not listed here. */

export interface GammaTag {
  id: string;
  label: string;
  slug: string;
  forceShow?: boolean;
}

export interface GammaMarket {
  id: string;
  /** Polymarket's on-chain condition id  what the Data API's
   * `/holders` endpoint takes (it does not accept our market id). */
  conditionId: string;
  question: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  /** The candidate/outcome's short name when this market is one row of
   * a grouped event (e.g. "Donald Trump" for a nomination market)
   * empty string when the market isn't part of such a group (verified
   * live  see `normalize.ts::toMarketListItems`). */
  groupItemTitle: string;
  /** JSON-encoded string array, e.g. `'["Yes","No"]'`. */
  outcomes: string;
  /** JSON-encoded string array of prices in the 0-1 range, same order
   * as `outcomes`. */
  outcomePrices: string;
  volumeNum: number | null;
  liquidityNum: number | null;
  endDate: string | null;
  startDate: string | null;
  closed: boolean;
  active: boolean;
  /** Set by Polymarket when a market is pulled from discovery; archived
   * markets are excluded from our lists the same way `closed` ones are
   * (verified live: the flag exists on real rows). */
  archived: boolean;
  featured: boolean;
  /** JSON-encoded string array of CLOB token ids, same order as
   * `outcomes` (verified live)  e.g. `'["123...", "456..."]'` for
   * `["Yes", "No"]`. Used by the trading flow to know which token a
   * BUY on a given choice is for. */
  clobTokenIds: string;
}

export interface GammaEvent {
  id: string;
  /** Set when this event is a **sub-event** of another one  Polymarket's
   * "- More Markets" extras. Such events are not standalone listings
   * (`public-search` excludes them too), so lists filter them out; the
   * event-detail endpoint still serves them for a direct link. */
  parentEventId?: string | null;
  title: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  volume: number | null;
  liquidity: number | null;
  endDate: string | null;
  closed: boolean;
  active: boolean;
  featured: boolean;
  tags: GammaTag[];
  markets: GammaMarket[];
}
