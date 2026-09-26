import type { Category, ID, ISODateString } from '@/types/common';
import type { MarketChoice, Outcome } from '@/types/market';

/** Mirrors `apps/frontend/src/types/social.ts` exactly — this backend is
 * a separate package so it can't import mobile's types directly, but
 * response shapes must match since the mobile client is already
 * written against them (see docs/API.md). */

export interface PositionSnapshot {
  marketId: ID;
  /** The choice's label at capture time ("Yes", "Manchester City", ...). */
  outcome: string;
  choiceIndex: number;
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

export interface MarketSummary {
  id: ID;
  question: string;
  /** The short outcome label when this market is one row of a grouped
   * event (`groupItemTitle`, e.g. "Gavin Newsom", "25 bps decrease");
   * `null` for ordinary markets. The event page and the child's own
   * Market Detail hero prefer this over the long `question` so the rows
   * don't all read as the same headline. */
  label?: string | null;
  /** Set only when this market is a **child** of an event with more than
   * one market; opening it from a post attachment goes to the parent
   * event's detail instead of the child's own page — see
   * docs/DECISIONS.md ("Attachment of a Child Market Opens Its Parent
   * Event"). */
  parentEventId?: ID | null;
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
  /** Every tradeable choice, in the market's own API order — what the
   * UI renders instead of a hardcoded Yes/No pair. */
  choices: MarketChoice[];
}

export interface MarketOutcomeRow {
  id: ID;
  label: string;
  yesPrice: number;
  noPrice: number;
  imageUrl?: string | null;
  choices: MarketChoice[];
}

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

export type MarketListItem =
  | { kind: 'market'; market: MarketSummary }
  | { kind: 'group'; group: MarketGroupSummary };

export interface MarketDetail extends MarketSummary {
  rules: string | null;
  openedAt: ISODateString | null;
  resolvedOutcome: Outcome | null;
}

export interface MarketHolder {
  id: ID;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  outcome: string;
  shares: number;
}

/**
 * A grouped event's own detail shape (`GET /events/:id`) — the event
 * header plus every discoverable child market, each of which is an
 * ordinary `MarketSummary` with its own `label`. Built live from
 * Polymarket's `/events/{id}` (docs/API.md).
 */
export interface EventDetail {
  id: ID;
  title: string;
  category: Category;
  imageUrl: string | null;
  volume: number | null;
  liquidity: number | null;
  endDate: ISODateString | null;
  /** The event's own description/rules text, when Polymarket has one. */
  description: string | null;
  markets: MarketSummary[];
}

/** One event-level Top Holders row — a position in one of the event's
 * child markets, with enough context to render the row without a second
 * lookup. Sourced from our own `positions` table (docs/API.md). */
export interface EventHolderRow {
  id: ID;
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  marketId: ID;
  marketLabel: string;
  outcome: string;
  shares: number;
}

/** Polymarket's own set of chart time windows. */
export type PriceRange = '1H' | '6H' | '1D' | '1W' | '1M' | 'ALL';

/** One point of a market's YES-price history — `price` is cents, the
 * same unit as `MarketSummary.yesPrice`. */
export interface PricePoint {
  timestamp: ISODateString;
  price: number;
}

export interface FeedItem {
  id: ID;
  author: User;
  body: string;
  market: MarketSummary | null;
  positionSnapshot: PositionSnapshot | null;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  /** Server-computed — whether the *authenticated viewer* may delete this
   * Callout. The client has no reliable local copy of its own user id,
   * same rule as `CommentItem.canDelete` (docs/DECISIONS.md). */
  canDelete: boolean;
  createdAt: ISODateString;
}

/** Phase 3 (Positions & Trading) types. */
/** A holding in the user's Polymarket Deposit Wallet. `id` is the outcome
 * token (asset) id. */
export interface UserPosition {
  id: ID;
  marketId: ID;
  marketQuestion: string;
  /** The chosen choice's label, as the market's API data had it. */
  outcome: string;
  choiceIndex: number;
  entryPrice: number; // cents
  currentPrice: number | null; // cents
  size: number; // shares
  /** Last activity on the position (Polymarket's `lastEventAt`). */
  openedAt: ISODateString;
  /** Live values from Polymarket's Data API. */
  conditionId?: string;
  valueUsd?: number;
  pnlUsd?: number;
  /** Resolved in this position's favor — redeem it to get pUSD back. */
  redeemable?: boolean;
}

/** Phase 2 (Social core) types. */

/** A Callout always attaches a held position — `positionId` required
 * (docs/DECISIONS.md, "Callouts Require a Held Position"). */
export interface CreateCallInput {
  body: string;
  positionId: string;
}

export interface CommentItem {
  id: ID;
  postId: ID;
  author: User;
  body: string;
  createdAt: ISODateString;
  canDelete: boolean;
  liked: boolean;
  likeCount: number;
  shareCount: number;
  replyCount: number;
  parentCommentId: ID | null;
}

export interface CreateCommentInput {
  body: string;
  parentCommentId?: ID;
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

export interface ShareResult {
  shareCount: number;
}

export interface FollowResult {
  following: boolean;
  followerCount: number;
}

export interface UserProfile extends User {
  bio: string | null;
  /** Public URL of the profile banner (Supabase Storage), or `null` when
   * the user hasn't uploaded one — the UI renders a soft gradient
   * placeholder in that case. */
  bannerUrl: string | null;
  followerCount: number;
  followingCount: number;
  callCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  tradingVolume: number | null;
}

export interface UpdateProfileInput {
  displayName: string;
  /** Lowercase, 3-20 chars, `a-z0-9_` only; the backend enforces
   * uniqueness against Knewit accounts and Polymarket leaderboard names. */
  handle: string;
  bio: string;
  /** Optional: omit to keep the current image, `null`/`''` to clear it.
   * Only URLs inside this app's public `profile-images` bucket are
   * accepted (never an arbitrary remote URL). */
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

/** `GET /users/handle-available?handle=` — whether the caller could
 * switch to this username right now. Advisory: `PATCH /users/me` still
 * decides, since a handle can be claimed between the check and a save.
 * `available: null` means the Polymarket name check couldn't run. */
export interface HandleAvailability {
  handle: string;
  available: boolean | null;
  reason: 'current' | 'invalid' | 'taken' | 'polymarket_trader' | 'unverified' | null;
  message: string;
}

export interface FollowListItem {
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  isFollowing: boolean;
  isSelf: boolean;
}
