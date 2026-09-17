import type { Category, ID, ISODateString } from '@/types/common';
import type { Outcome } from '@/types/market';

/** Mirrors `apps/frontend/src/types/social.ts` exactly — this backend is
 * a separate package so it can't import mobile's types directly, but
 * response shapes must match since the mobile client is already
 * written against them (see docs/API.md). */

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
  outcomeLabels?: { yes: string; no: string };
}

export interface MarketOutcomeRow {
  id: ID;
  label: string;
  yesPrice: number;
  noPrice: number;
  imageUrl?: string | null;
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
  outcome: Outcome;
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
  createdAt: ISODateString;
}

/** Phase 3 (Positions & Trading) types. */
export interface UserPosition {
  id: ID;
  marketId: ID;
  marketQuestion: string;
  outcome: Outcome;
  entryPrice: number; // cents
  currentPrice: number | null; // cents
  size: number; // shares
  openedAt: ISODateString;
}

/** Phase 2 (Social core) types. */

/** A Callout always attaches a held position — `positionId` required
 * (docs/DECISIONS.md, "Callouts Require a Held Position"). */
export interface CreatePostInput {
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
  followerCount: number;
  followingCount: number;
  postCount: number;
  callCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  tradingVolume: number | null;
  leaderboardRank: number | null;
}

export interface UpdateProfileInput {
  displayName: string;
  bio: string;
}

export interface FollowListItem {
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  isFollowing: boolean;
  isSelf: boolean;
}
