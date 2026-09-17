import type { ID, ISODateString } from '@/types/common';
import type { User } from '@/types/social';

/**
 * Deliberately **not** the full event vocabulary Sprint 11's spec lists
 * as examples (it also mentions `POSITION_CLOSED`) — this app has no
 * position-closing feature anywhere (Sprint 7 never implemented closing
 * a position), so an activity feed can't honestly report an event that
 * can't actually occur. Only events this app can genuinely produce and
 * verify server-side are represented — see docs/DECISIONS.md ("Activity
 * Types Limited to What This App Can Actually Produce"). A "position
 * opened" is the direct result of a `TRADE`, not a separate event.
 */
export type ActivityType = 'TRADE' | 'CALL' | 'FOLLOW';

interface ActivityItemBase {
  id: ID;
  createdAt: ISODateString;
}

export interface TradeActivityItem extends ActivityItemBase {
  type: 'TRADE';
  marketId: ID;
  marketQuestion: string;
  /** The chosen choice's label, as the market's API data had it. */
  outcome: string;
  choiceIndex: number;
  usdAmount: number;
}

/** A position-backed Call was published — distinct from `TRADE` even
 * though both reference a market/outcome, since publishing a Call is a
 * separate, later, optional action a user may never take after trading
 * — see docs/SOCIAL-FEATURE.md. */
export interface CallActivityItem extends ActivityItemBase {
  type: 'CALL';
  postId: ID;
  marketQuestion: string;
  outcome: string;
  choiceIndex: number;
}

export interface FollowActivityItem extends ActivityItemBase {
  type: 'FOLLOW';
  followedUser: Pick<User, 'id' | 'displayName' | 'handle'>;
}

/**
 * A discriminated union on `type` — each variant only ever carries the
 * fields that event actually has, so rendering can `switch` on `type`
 * without any variant needing to fake fields it doesn't have (e.g. a
 * `FOLLOW` event has no market to reference).  Only ever created
 * server-side from an event that actually completed — see
 * docs/DECISIONS.md ("Activity Events Reflect Only Completed Server
 * Actions").
 */
export type ActivityItem =
  TradeActivityItem | CallActivityItem | FollowActivityItem;
