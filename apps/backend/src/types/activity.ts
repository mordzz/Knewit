import type { ID, ISODateString } from '@/types/common';
import type { Outcome } from '@/types/market';
import type { User } from '@/types/social';

/** Mirrors `apps/frontend/src/types/activity.ts` exactly. */
export type ActivityType = 'TRADE' | 'CALL' | 'POST' | 'FOLLOW';

interface ActivityItemBase {
  id: ID;
  createdAt: ISODateString;
}

export interface TradeActivityItem extends ActivityItemBase {
  type: 'TRADE';
  marketId: ID;
  marketQuestion: string;
  outcome: Outcome;
  usdAmount: number;
}

export interface CallActivityItem extends ActivityItemBase {
  type: 'CALL';
  postId: ID;
  marketQuestion: string;
  outcome: Outcome;
}

export interface PostActivityItem extends ActivityItemBase {
  type: 'POST';
  postId: ID;
}

export interface FollowActivityItem extends ActivityItemBase {
  type: 'FOLLOW';
  followedUser: Pick<User, 'id' | 'displayName' | 'handle'>;
}

export type ActivityItem = TradeActivityItem | CallActivityItem | PostActivityItem | FollowActivityItem;
