import type { ID, ISODateString } from "@/types/common";
import type { User } from "@/types/social";

/** Mirrors `apps/frontend/src/types/activity.ts` exactly. */
interface ActivityItemBase {
  id: ID;
  createdAt: ISODateString;
}

export interface TradeActivityItem extends ActivityItemBase {
  type: "TRADE";
  marketId: ID;
  marketQuestion: string;
  /** The chosen choice's label, as the market's API data had it. */
  outcome: string;
  choiceIndex: number;
  usdAmount: number;
}

export interface CallActivityItem extends ActivityItemBase {
  type: "CALL";
  postId: ID;
  marketQuestion: string;
  outcome: string;
  choiceIndex: number;
}

export interface FollowActivityItem extends ActivityItemBase {
  type: "FOLLOW";
  followedUser: Pick<User, "id" | "displayName" | "handle">;
}

export type ActivityItem = TradeActivityItem | CallActivityItem | FollowActivityItem;
