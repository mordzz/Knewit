import type { Category, ID, ISODateString } from '@/types/common';
import type { Outcome } from '@/types/market';

/**
 * Frozen at Call-creation time from the user's live Polymarket position.
 * Never edited after creation — see docs/SOCIAL-FEATURE.md.
 */
export interface PositionSnapshot {
  marketId: ID;
  outcome: Outcome;
  entryPrice: number; // cents
  size: number; // shares
  capturedAt: ISODateString;
}

export interface User {
  id: ID;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string | null;
}

/**
 * A Post has no position attached. A Call is a Post with a PositionSnapshot,
 * which is what earns the "✓ Verified Position" badge. Keep this the only
 * distinguishing field — see docs/SOCIAL-FEATURE.md.
 */
export interface Post {
  id: ID;
  authorId: ID;
  body: string;
  marketId: ID | null;
  positionSnapshot: PositionSnapshot | null;
  likeCount: number;
  commentCount: number;
  createdAt: ISODateString;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  body: string;
  createdAt: ISODateString;
}

/**
 * The denormalized shape the feed API returns for rendering — a market
 * summary rather than just a `marketId`, so a card never needs a second
 * lookup. `Market` (types/market.ts) remains the full, normalized entity.
 *
 * `trending`/`resolved`/`imageUrl` support `MarketAttachment`'s richer
 * states (trending indicator, closed/resolved treatment, market image
 * with a category-icon fallback) — see docs/DESIGN.md. All optional/
 * nullable since not every market has them and the card must render
 * correctly either way.
 *
 * `closed` vs `resolved`: a market stops accepting trades when it
 * `closed`s, but its final outcome isn't settled/paid out until it's
 * `resolved` — distinct Polymarket lifecycle states, not the same flag
 * twice. `isBinary`/`outcomeCount` support non-binary/multi-outcome
 * markets existing in the data source without implying they support the
 * MVP YES/NO trading flow — see docs/DECISIONS.md (Sprint 3). Undefined
 * `isBinary` means binary (every market built before Sprint 3 assumed
 * this), so existing data/fixtures don't need to be touched.
 */
export interface MarketSummary {
  id: ID;
  question: string;
  category: Category;
  yesPrice: number; // cents
  noPrice: number; // cents
  volume: number | null;
  liquidity?: number | null;
  endDate: ISODateString | null;
  trending?: boolean;
  closed?: boolean;
  resolved?: boolean;
  isBinary?: boolean;
  outcomeCount?: number | null;
  imageUrl?: string | null;
  /** Overrides "Yes"/"No" for markets framed differently (e.g. a
   * short-duration crypto price market reads better as "Up"/"Down") —
   * a labeling choice only, still the same YES/NO trading model
   * underneath. Undefined means the literal "Yes"/"No" default — see
   * docs/DECISIONS.md (Markets visual refresh). */
  outcomeLabels?: { yes: string; no: string };
}

/**
 * One named row inside a `MarketGroupSummary` — a single candidate in
 * an election, one threshold on a "how high will X go" ladder, one side
 * of a head-to-head matchup. Each row is still an ordinary binary
 * YES/NO market under the hood (it has its own `id`, tradeable on its
 * own) — grouping several rows under one card is a presentation
 * concept for markets the data source relates to each other, not a
 * different trading model. See docs/DECISIONS.md (Markets visual
 * refresh).
 */
export interface MarketOutcomeRow {
  id: ID;
  label: string;
  yesPrice: number; // cents
  noPrice: number; // cents
  imageUrl?: string | null;
}

/**
 * A market presented as several named outcomes rather than one YES/NO
 * pair (Sprint 3's Markets visual refresh, see docs/DECISIONS.md) —
 * genuinely different data shape from `MarketSummary`, not a different
 * category. Rendered by the same `MarketCard` component via a branch on
 * shape, never a per-category component — see docs/DESIGN.md.
 */
export interface MarketGroupSummary {
  id: ID;
  title: string;
  category: Category;
  imageUrl?: string | null;
  volume: number | null;
  liquidity?: number | null;
  endDate: ISODateString | null;
  trending?: boolean;
  closed?: boolean;
  resolved?: boolean;
  outcomes: MarketOutcomeRow[];
}

/**
 * The Markets discovery feed can mix ordinary single markets and
 * grouped ones on the same page — tagged with `kind` so a renderer
 * knows which shape it received without guessing from field presence.
 */
export type MarketListItem =
  { kind: 'market'; market: MarketSummary } | { kind: 'group'; group: MarketGroupSummary };

/**
 * The feed/API rendering shape of a Post — `author`/`market` are expanded
 * objects (not just ids) since that's what a feed response realistically
 * returns. `Post` (above) stays the normalized DB-shaped entity — see
 * docs/DATABASE.md and docs/API.md.
 */
export interface FeedItem {
  id: ID;
  author: User;
  body: string;
  market: MarketSummary | null;
  positionSnapshot: PositionSnapshot | null;
  likeCount: number;
  commentCount: number;
  createdAt: ISODateString;
}
