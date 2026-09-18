import {
  buildMockFeed,
  buildMockUserContent,
  mockUserContentTotal,
  pickMockFeedItem,
} from '@/lib/guest/fixtures/feed.mock';
import {
  buildMockComments,
  buildMockReplies,
  buildMockUserReplies,
  mockUserRepliesTotal,
  MOCK_COMMENT_TOTAL,
  MOCK_REPLY_COMMENT_TOTAL,
} from '@/lib/guest/fixtures/comments.mock';
import {
  buildMockGroups,
  buildMockMarketList,
  buildMockMarkets,
  pickMockMarketTemplate,
  searchMockMarketList,
} from '@/lib/guest/fixtures/markets.mock';
import {
  buildMockHolders,
  buildMockMarketActivity,
  buildMockPriceHistory,
  buildMockRules,
} from '@/lib/guest/fixtures/marketDetail.mock';
import {
  buildMockActivity,
  MOCK_ACTIVITY_TOTAL,
} from '@/lib/guest/fixtures/activity.mock';
import {
  buildMockFollowList,
  MOCK_FOLLOW_LIST_TOTAL,
} from '@/lib/guest/fixtures/followList.mock';
import { buildMockUserProfile } from '@/lib/guest/fixtures/userProfile.mock';
import { MOCK_PEOPLE, searchMockPeople } from '@/lib/guest/fixtures/people.mock';
import { GUEST_USER_ID } from '@/lib/guest/guestStore';
import type { GuestState } from '@/lib/guest/guestStore';
import type { ActivityItem } from '@/types/activity';
import type { CategoryOption, Paginated } from '@/types/common';
import type { LeaderboardEntry } from '@/types/leaderboard';
import type { SearchResults } from '@/types/search';
import type {
  CommentItem,
  EventDetail,
  EventHolderRow,
  FeedItem,
  FollowListItem,
  MarketDetail,
  MarketHolder,
  MarketGroupSummary,
  MarketListItem,
  MarketOutcomeRow,
  MarketSummary,
  PriceRange,
  User,
  UserProfile,
} from '@/types/social';
import type { TradeEstimate } from '@/types/trading';

/**
 * Pure builders for the guest sandbox — the data half of
 * `guestBackend.ts`. Everything here is derived from this app's own
 * `*.mock.ts` fixtures plus whatever the guest has done in-session, so
 * `guestBackend` can answer API requests without a network or database.
 * DEVELOPMENT/DEMO-ONLY by construction (see docs/DECISIONS.md, "Guest
 * Mode").
 */

export const GUEST_FEED_SIZE = 18;
export const GUEST_PAGE_SIZE = 5;

export function paginate<T>(
  items: T[],
  cursor: string | undefined,
  pageSize = GUEST_PAGE_SIZE
): Paginated<T> {
  const start = cursor ? Math.max(0, Number(cursor) || 0) : 0;
  const page = items.slice(start, start + pageSize);
  const consumed = start + page.length;
  return { items: page, nextCursor: consumed < items.length ? String(consumed) : null };
}

/** Walks a cursor-paginated fixture builder until `total` items are
 * collected, so a merged (fixture + guest-created) list can be paginated
 * as one array. */
function materializePages<T>(total: number, fetch: (cursor?: string) => T[]): T[] {
  const out: T[] = [];
  while (out.length < total) {
    const page = fetch(out.length > 0 ? String(out.length) : undefined);
    if (page.length === 0) break;
    out.push(...page);
  }
  return out;
}

export function guestUser(state: GuestState): User {
  return {
    id: state.profile.id,
    handle: state.profile.handle,
    displayName: state.profile.displayName,
    avatarUrl: state.profile.avatarUrl,
    walletAddress: state.walletAddress,
  };
}

export function guestProfile(state: GuestState): UserProfile {
  return {
    ...guestUser(state),
    bio: state.profile.bio,
    bannerUrl: state.profile.bannerUrl,
    followerCount: state.profile.followerCount + (state.followerDeltas[state.profile.id] ?? 0),
    followingCount: Object.values(state.follows).filter(Boolean).length,
    callCount: state.createdCalls.length + mockUserContentTotal(),
    isFollowing: false,
    isSelf: true,
    tradingVolume: state.tradingVolume > 0 ? state.tradingVolume : null,
  };
}

const OTHER_FOLLOWER_COUNT = 128;
const OTHER_FOLLOWING_COUNT = 42;

export function otherUserProfile(state: GuestState, userId: string): UserProfile {
  const person = MOCK_PEOPLE.find((candidate) => candidate.id === userId);
  const base = { ...buildMockUserProfile(userId), ...(person ?? {}) };
  return {
    ...base,
    followerCount: OTHER_FOLLOWER_COUNT + (state.followerDeltas[userId] ?? 0),
    followingCount: OTHER_FOLLOWING_COUNT,
    callCount: mockUserContentTotal(),
    isFollowing: state.follows[userId] === true,
    isSelf: false,
    tradingVolume: null,
  };
}

function guestCommentCount(state: GuestState, postId: string): number {
  return state.comments.filter(
    (comment) => comment.postId === postId && !state.deletedCommentIds.includes(comment.id)
  ).length;
}

export function applyCallOverlay(state: GuestState, item: FeedItem): FeedItem {
  const like = state.callLikes[item.id];
  return {
    ...item,
    liked: like?.liked ?? item.liked,
    likeCount: like?.likeCount ?? item.likeCount,
    commentCount: item.commentCount + guestCommentCount(state, item.id),
    canDelete: item.canDelete || item.author.id === GUEST_USER_ID,
  };
}

export function rawGuestFeed(state: GuestState): FeedItem[] {
  const fixture = buildMockFeed(GUEST_FEED_SIZE);
  return [...state.createdCalls, ...fixture].filter(
    (item) => !state.deletedCallIds.includes(item.id)
  );
}

export function guestFeed(state: GuestState): FeedItem[] {
  return rawGuestFeed(state).map((item) => applyCallOverlay(state, item));
}

export function rawGuestFollowingFeed(state: GuestState): FeedItem[] {
  const followed = new Set(
    Object.entries(state.follows)
      .filter(([, following]) => following)
      .map(([id]) => id)
  );
  return rawGuestFeed(state).filter(
    (item) => item.author.id === GUEST_USER_ID || followed.has(item.author.id)
  );
}

export function guestFollowingFeed(state: GuestState): FeedItem[] {
  return rawGuestFollowingFeed(state).map((item) => applyCallOverlay(state, item));
}

export function rawGuestUserCalls(state: GuestState, userId: string): FeedItem[] {
  if (userId === 'me' || userId === GUEST_USER_ID) {
    const fixture = materializePages(mockUserContentTotal(), (cursor) =>
      buildMockUserContent('me', cursor)
    );
    return [...state.createdCalls, ...fixture].filter(
      (item) => !state.deletedCallIds.includes(item.id)
    );
  }
  return materializePages(mockUserContentTotal(), (cursor) =>
    buildMockUserContent(userId, cursor)
  );
}

export function guestUserCalls(state: GuestState, userId: string): FeedItem[] {
  return rawGuestUserCalls(state, userId).map((item) => applyCallOverlay(state, item));
}

/** Finds the `FeedItem` behind an id — the sandbox's own created calls
 * first, then one already served (`knownCalls`), then a Market Detail
 * activity fixture (`<marketId>-activity-<n>`), and finally a
 * deterministic template for anything else. */
export function findCallById(state: GuestState, id: string): FeedItem {
  const created = state.createdCalls.find((item) => item.id === id);
  if (created) return created;
  const known = state.knownCalls[id];
  if (known) return known;

  const activity = /^(.+)-activity-(\d+)$/.exec(id);
  if (activity) {
    const match = buildMockMarketActivity(activity[1])[Number(activity[2])];
    if (match) return match;
  }
  return pickMockFeedItem(id);
}

export function applyCommentOverlay(state: GuestState, item: CommentItem): CommentItem {
  const like = state.commentLikes[item.id];
  return {
    ...item,
    liked: like?.liked ?? item.liked,
    likeCount: like?.likeCount ?? item.likeCount,
    shareCount: item.shareCount + (state.commentShares[item.id] ?? 0),
    canDelete: item.canDelete || item.author.id === GUEST_USER_ID,
  };
}

function withoutDeletedComments(state: GuestState, items: CommentItem[]): CommentItem[] {
  return items.filter((item) => !state.deletedCommentIds.includes(item.id));
}

export function rawGuestComments(state: GuestState, postId: string): CommentItem[] {
  const fixture = withoutDeletedComments(state, allMockComments(postId));
  const created = state.comments.filter(
    (comment) =>
      comment.postId === postId &&
      comment.parentCommentId === null &&
      !state.deletedCommentIds.includes(comment.id)
  );
  return [...created, ...fixture];
}

export function guestComments(state: GuestState, postId: string): CommentItem[] {
  return rawGuestComments(state, postId).map((item) => applyCommentOverlay(state, item));
}

export function rawGuestReplies(
  state: GuestState,
  commentId: string,
  postId: string
): CommentItem[] {
  const fixture = withoutDeletedComments(state, allMockReplies(commentId, postId));
  const created = state.comments.filter(
    (comment) =>
      comment.parentCommentId === commentId && !state.deletedCommentIds.includes(comment.id)
  );
  return [...created, ...fixture];
}

export function guestCommentReplies(
  state: GuestState,
  commentId: string,
  postId: string
): CommentItem[] {
  return rawGuestReplies(state, commentId, postId).map((item) =>
    applyCommentOverlay(state, item)
  );
}

export function guestMarketList(category?: string): MarketListItem[] {
  return buildMockMarketList(GUEST_FEED_SIZE, category);
}

export function findCommentById(state: GuestState, id: string): CommentItem | null {
  return (
    state.comments.find((comment) => comment.id === id) ??
    state.knownComments[id] ??
    Object.values(state.knownComments).find((comment) => comment.id === id) ??
    null
  );
}

export function allMockComments(postId: string): CommentItem[] {
  return materializePages(MOCK_COMMENT_TOTAL, (cursor) => buildMockComments(postId, cursor));
}

export function allMockReplies(commentId: string, postId: string): CommentItem[] {
  return materializePages(MOCK_REPLY_COMMENT_TOTAL, (cursor) =>
    buildMockReplies(commentId, postId, cursor)
  );
}

export function rawGuestUserReplies(state: GuestState, userId: string): CommentItem[] {
  if (userId === 'me' || userId === GUEST_USER_ID) {
    const fixture = materializePages(mockUserRepliesTotal(), (cursor) =>
      buildMockUserReplies('me', cursor)
    );
    const created = state.comments.filter(
      (comment) => comment.author.id === GUEST_USER_ID && !state.deletedCommentIds.includes(comment.id)
    );
    return [...created, ...fixture];
  }
  return materializePages(mockUserRepliesTotal(), (cursor) =>
    buildMockUserReplies(userId, cursor)
  );
}

export function guestActivity(state: GuestState, userId: string): ActivityItem[] {
  if (userId === 'me' || userId === GUEST_USER_ID) {
    const fixture = materializePages(MOCK_ACTIVITY_TOTAL, (cursor) =>
      buildMockActivity('me', cursor)
    );
    return [...state.activity, ...fixture];
  }
  return materializePages(MOCK_ACTIVITY_TOTAL, (cursor) => buildMockActivity(userId, cursor));
}

function followListUser(user: User): FollowListItem['user'] {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export function guestFollowList(
  state: GuestState,
  kind: 'followers' | 'following',
  userId: string
): FollowListItem[] {
  const isSelf = userId === 'me' || userId === GUEST_USER_ID;
  if (isSelf) {
    const people =
      kind === 'followers'
        ? MOCK_PEOPLE.slice(0, 3)
        : MOCK_PEOPLE.filter((person) => state.follows[person.id]);
    return people.map((person) => ({
      user: followListUser(person),
      isFollowing: state.follows[person.id] === true,
      isSelf: false,
    }));
  }

  return materializePages(MOCK_FOLLOW_LIST_TOTAL, (cursor) =>
    buildMockFollowList(userId, cursor)
  ).map((item) => ({
    ...item,
    user: MOCK_PEOPLE.find((person) => person.id === item.user.id)
      ? followListUser(MOCK_PEOPLE.find((person) => person.id === item.user.id)!)
      : item.user,
    isFollowing: state.follows[item.user.id] === true,
    isSelf: false,
  }));
}

export function guestSuggestions(state: GuestState): FollowListItem[] {
  return MOCK_PEOPLE.filter((person) => state.follows[person.id] !== true).map((person) => ({
    user: followListUser(person),
    isFollowing: false,
    isSelf: false,
  }));
}

const LEADERBOARD_EXTRA: User[] = [
  {
    id: 'trader-satoshi',
    handle: 'satoshibets',
    displayName: 'Satoshi B',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'trader-vex',
    handle: 'vex_markets',
    displayName: 'Vex',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'trader-nova',
    handle: 'nova.eth',
    displayName: 'Nova',
    avatarUrl: null,
    walletAddress: null,
  },
];

const LEADERBOARD_VOLUMES = [1_840_000, 1_275_000, 980_400, 742_100, 615_800, 402_600, 318_200, 154_900];

export function guestLeaderboard(): LeaderboardEntry[] {
  return [...MOCK_PEOPLE, ...LEADERBOARD_EXTRA]
    .map((user, index) => ({ user, value: LEADERBOARD_VOLUMES[index] ?? 120_000 - index * 4_000 }))
    .sort((a, b) => b.value - a.value)
    .map((row, index) => ({
      rank: index + 1,
      user: followListUser(row.user),
      metric: { name: 'volume' as const, value: row.value },
    }));
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-');
}

export function guestCategories(): CategoryOption[] {
  const labels = new Set<string>();
  for (const market of buildMockMarkets(9)) labels.add(market.category);
  for (const group of buildMockGroups(4)) labels.add(group.category);
  return Array.from(labels).map((label) => ({ label, slug: slugify(label) }));
}

interface ParsedGroup {
  category?: string;
  index: number;
}

function parseGroupId(id: string): ParsedGroup | null {
  // A child market id (`...-outcome-N`) ends in a number too — reject it
  // here so a child is never mistaken for its parent group/event.
  if (id.includes('-outcome-')) return null;
  const mock = /^mock-group-(.+)-(\d+)$/.exec(id);
  if (mock) return { category: mock[1] === 'all' ? undefined : mock[1], index: Number(mock[2]) };
  const search = /^search-group-(\d+)$/.exec(id);
  if (search) return { index: Number(search[1]) };
  return null;
}

function buildGroup(parsed: ParsedGroup): MarketGroupSummary | null {
  const groups = buildMockGroups(Math.max(parsed.index + 1, 4), parsed.category);
  return groups[parsed.index] ?? buildMockGroups(4, parsed.category)[0] ?? buildMockGroups(4)[0] ?? null;
}

function childSummary(
  group: MarketGroupSummary,
  row: MarketOutcomeRow,
  parentEventId: string
): MarketSummary {
  return {
    id: row.id,
    question: `${group.title} — ${row.label}`,
    label: row.label,
    parentEventId,
    category: group.category,
    yesPrice: row.yesPrice,
    noPrice: row.noPrice,
    volume: group.volume == null ? null : Math.round(group.volume / Math.max(1, group.outcomes.length)),
    liquidity: group.liquidity ?? null,
    endDate: group.endDate,
    trending: group.trending,
    closed: group.closed,
    resolved: group.resolved,
    isBinary: true,
    imageUrl: row.imageUrl ?? group.imageUrl ?? null,
    choices: row.choices,
  };
}

function childMarketSummary(id: string): MarketSummary | null {
  const match = /^(.+)-outcome-(\d+)$/.exec(id);
  if (!match) return null;
  const parsed = parseGroupId(match[1]);
  if (!parsed) return null;
  const group = buildGroup(parsed);
  const row = group?.outcomes[Number(match[2])];
  if (!group || !row) return null;
  return childSummary(group, row, match[1]);
}

export function guestEventDetail(eventId: string): EventDetail | null {
  const parsed = parseGroupId(eventId);
  if (!parsed) return null;
  const group = buildGroup(parsed);
  if (!group) return null;
  return {
    id: eventId,
    title: group.title,
    category: group.category,
    imageUrl: group.imageUrl ?? null,
    volume: group.volume,
    liquidity: group.liquidity ?? null,
    endDate: group.endDate,
    description: buildMockRules(group.title),
    markets: group.outcomes.map((row) => childSummary(group, row, eventId)),
  };
}

export function guestMarketDetail(marketId: string): MarketDetail {
  const child = childMarketSummary(marketId);
  const base = child ?? { ...pickMockMarketTemplate(marketId), id: marketId };
  return {
    ...base,
    id: marketId,
    rules: buildMockRules(base.question),
    openedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    resolvedOutcome: base.resolved ? (base.yesPrice >= base.noPrice ? 'YES' : 'NO') : null,
  };
}

export function marketSummaryOf(detail: MarketDetail): MarketSummary {
  return { ...detail };
}

export function guestMarketActivity(state: GuestState, marketId: string): FeedItem[] {
  const created = state.createdCalls.filter(
    (item) => item.market?.id === marketId && !state.deletedCallIds.includes(item.id)
  );
  const fixture = buildMockMarketActivity(marketId);
  return [...created, ...fixture].map((item) => applyCallOverlay(state, item));
}

export function guestEventActivity(state: GuestState, eventId: string): FeedItem[] {
  const event = guestEventDetail(eventId);
  if (!event) return [];
  const childIds = new Set(event.markets.map((market) => market.id));
  const created = state.createdCalls.filter(
    (item) => item.market != null && childIds.has(item.market.id) && !state.deletedCallIds.includes(item.id)
  );
  if (created.length > 0) return created.map((item) => applyCallOverlay(state, item));
  const firstChild = event.markets[0]?.id;
  if (!firstChild) return [];
  return buildMockMarketActivity(firstChild).map((item) => applyCallOverlay(state, item));
}

export function guestMarketHolders(state: GuestState, marketId: string): MarketHolder[] {
  const guestRows = state.positions
    .filter((position) => position.marketId === marketId)
    .map((position) => ({
      id: `guest-holder-${position.id}`,
      displayName: state.profile.displayName,
      handle: state.profile.handle,
      avatarUrl: state.profile.avatarUrl,
      outcome: position.outcome,
      shares: position.size,
    }));
  return [...guestRows, ...buildMockHolders(marketId)];
}

export function guestEventHolders(
  state: GuestState,
  eventId: string,
  marketId?: string
): EventHolderRow[] {
  const event = guestEventDetail(eventId);
  if (!event) return [];
  const markets = marketId ? event.markets.filter((market) => market.id === marketId) : event.markets;
  return markets.flatMap((market) =>
    guestMarketHolders(state, market.id).map((holder) => ({
      id: `${market.id}-${holder.id}`,
      user: {
        id: `holder-${holder.handle}`,
        handle: holder.handle,
        displayName: holder.displayName,
        avatarUrl: holder.avatarUrl,
      },
      marketId: market.id,
      marketLabel: market.label ?? market.question,
      outcome: holder.outcome,
      shares: holder.shares,
    }))
  );
}

export function guestPriceHistory(
  marketId: string,
  range: PriceRange,
  choiceIndex: number
): { timestamp: string; price: number }[] {
  const detail = guestMarketDetail(marketId);
  const price = detail.choices[choiceIndex]?.price ?? detail.yesPrice;
  return buildMockPriceHistory(marketId, range, price, choiceIndex);
}

export function guestTradeEstimate(
  marketId: string,
  choiceIndex: number,
  usdAmount: number
): TradeEstimate | null {
  const detail = guestMarketDetail(marketId);
  const choice = detail.choices[choiceIndex];
  if (!choice || choice.price <= 0) return null;
  return {
    estimatedPrice: choice.price,
    estimatedShares: Number(((usdAmount * 100) / choice.price).toFixed(2)),
  };
}

export function guestSearch(query: string): SearchResults {
  return {
    people: searchMockPeople(query),
    markets: searchMockMarketList(query),
  };
}
