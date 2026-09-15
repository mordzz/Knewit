import type { ID, ISODateString } from '@/types/common';
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
