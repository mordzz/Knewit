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
 */
export interface MarketSummary {
  id: ID;
  question: string;
  category: Category;
  yesPrice: number; // cents
  noPrice: number; // cents
  volume: number | null;
  endDate: ISODateString | null;
  trending?: boolean;
  resolved?: boolean;
  imageUrl?: string | null;
}

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
