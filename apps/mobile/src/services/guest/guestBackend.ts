import { POLYGON_USDC_E } from '@/features/wallet/services/walletService';
import { MOCK_PEOPLE } from '@/features/search/fixtures/people.mock';
import * as data from '@/services/guest/guestData';
import {
  GUEST_USER_ID,
  isGuestSession,
  useGuestStore,
  type GuestState,
} from '@/store/guest/guestStore';
import type { ApiError } from '@/types/api';
import type {
  CommentItem,
  CreateCallInput,
  CreateCommentInput,
  FeedItem,
  HandleAvailability,
  UpdateProfileInput,
} from '@/types/social';
import type { CreateTradeInput } from '@/types/trading';
import type { Order } from '@/types/market';

export { isGuestSession };

/**
 * The guest sandbox's fake backend — every endpoint the app's services
 * call is answered from `guestStore` + `guestData`, so guest mode works
 * with no Privy session, no backend, and no network. `apiRequest` routes
 * here before touching `fetch` (see `services/api/client.ts`).
 *
 * This is the one place in the app that deliberately fabricates trades,
 * positions, likes, and rankings — allowed only because the person
 * explicitly chose guest mode and none of it leaves the device (see
 * docs/DECISIONS.md, "Guest Mode").
 */
export class GuestApiError extends Error {
  constructor(
    public status: number,
    public body: ApiError
  ) {
    super(body.message);
  }
}

function fail(status: number, code: string, message: string): never {
  throw new GuestApiError(status, { code, message });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonBody(body: unknown): unknown {
  if (typeof body !== 'string' || body.length === 0) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

const MAX_BODY_LENGTH = 280;

function nextGuestId(state: GuestState, prefix: string): string {
  return `guest-${prefix}-${state.nextId}`;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function requireGuest(): GuestState {
  const state = useGuestStore.getState();
  if (!state.isGuest) {
    fail(401, 'unauthorized', 'Guest session has ended.');
  }
  return state;
}

/** One runnable sanity check (dev only) that the sandbox's core builders
 * still answer — fails loudly instead of the UI silently showing empty
 * screens. See docs/DEVELOPMENT.md. */
let selfChecked = false;
export function selfCheckGuestBackend(): void {
  if (selfChecked || !__DEV__) return;
  selfChecked = true;
  const state = useGuestStore.getState();
  const feed = data.guestFeed(state);
  if (feed.length === 0) throw new Error('[guest] self-check: feed fixtures returned nothing');
  const page = data.paginate(feed, undefined, 5);
  if (page.items.length === 0 || page.nextCursor === null) {
    throw new Error('[guest] self-check: pagination did not produce a first page');
  }
  const event = data.guestEventDetail('mock-group-all-2');
  if (!event || event.markets.length === 0) {
    throw new Error('[guest] self-check: event fixtures returned nothing');
  }
  const detail = data.guestMarketDetail(feed[0].market?.id ?? 'mock-market-all-0');
  if (!detail.choices || detail.choices.length === 0) {
    throw new Error('[guest] self-check: market detail produced no choices');
  }
}

/** Demo top-up behind guest mode's Deposit button — there is no Privy
 * funding flow to open without a real account, so this credits the
 * sandbox balance instead (clearly a demo-only action). */
export function creditGuestFunds(amount: number): void {
  const state = useGuestStore.getState();
  if (!state.isGuest) return;
  useGuestStore.setState({ balanceUsdc: round(state.balanceUsdc + amount, 2) });
}

export async function guestRequest<T>(path: string, init?: RequestInit): Promise<T> {
  await delay(160);
  selfCheckGuestBackend();
  const state = requireGuest();

  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = parseJsonBody(init?.body);

  return route(pathname, method, params, body, init?.body, state) as T;
}

function route(
  pathname: string,
  method: string,
  params: URLSearchParams,
  body: unknown,
  rawBody: unknown,
  state: GuestState
): unknown {
  // --- market data -------------------------------------------------------
  if (pathname === '/categories' && method === 'GET') return data.guestCategories();

  if (pathname === '/markets' && method === 'GET') {
    const category = params.get('category') ?? undefined;
    return data.paginate(data.guestMarketList(category), params.get('cursor') ?? undefined, 6);
  }
  if (pathname === '/markets/trending' && method === 'GET') {
    const items = data
      .guestMarketList()
      .filter((item) => (item.kind === 'market' ? item.market.trending : item.group.trending));
    return data.paginate(items, params.get('cursor') ?? undefined, 6);
  }
  if (pathname === '/markets/closing-soon' && method === 'GET') {
    const soon = Date.now() + 7 * 86_400_000;
    const items = data.guestMarketList().filter((item) => {
      const endDate = item.kind === 'market' ? item.market.endDate : item.group.endDate;
      if (!endDate) return false;
      const time = new Date(endDate).getTime();
      return time > Date.now() && time < soon;
    });
    return data.paginate(items, params.get('cursor') ?? undefined, 6);
  }

  const marketMatch = /^\/markets\/([^/]+)(\/.*)?$/.exec(pathname);
  if (marketMatch && method === 'GET') {
    const marketId = decodeURIComponent(marketMatch[1]);
    const sub = marketMatch[2];
    if (!sub) {
      // A group id is an event, not a market — the 404 here is what the
      // web app's market-then-event fallback keys off to open the event.
      if (data.guestEventDetail(marketId)) {
        fail(404, 'not_found', `Market ${marketId} not found.`);
      }
      return data.guestMarketDetail(marketId);
    }
    if (sub === '/activity') return data.guestMarketActivity(state, marketId);
    if (sub === '/holders') return data.guestMarketHolders(state, marketId);
    if (sub === '/price-history') {
      const range = (params.get('range') ?? '1D') as Parameters<typeof data.guestPriceHistory>[1];
      return data.guestPriceHistory(marketId, range, Number(params.get('choice') ?? 0));
    }
    if (sub === '/trade-estimate') {
      const estimate = data.guestTradeEstimate(
        marketId,
        Number(params.get('choiceIndex') ?? 0),
        Number(params.get('usdAmount') ?? 0)
      );
      if (!estimate) fail(404, 'not_found', `No trade estimate for market ${marketId}.`);
      return estimate;
    }
    fail(404, 'not_found', `Unknown market route ${pathname}.`);
  }

  const eventMatch = /^\/events\/([^/]+)(\/.*)?$/.exec(pathname);
  if (eventMatch && method === 'GET') {
    const eventId = decodeURIComponent(eventMatch[1]);
    const sub = eventMatch[2];
    if (!sub) {
      const event = data.guestEventDetail(eventId);
      if (!event) fail(404, 'not_found', `Event ${eventId} not found.`);
      return event;
    }
    if (sub === '/activity') return data.guestEventActivity(state, eventId);
    if (sub === '/holders') {
      return data.guestEventHolders(state, eventId, params.get('market') ?? undefined);
    }
    fail(404, 'not_found', `Unknown event route ${pathname}.`);
  }

  // --- wallet / positions / trading -------------------------------------
  if (pathname === '/wallet/balance' && method === 'GET') {
    return {
      usdc: state.balanceUsdc,
      allowances: {},
      collateral: POLYGON_USDC_E,
      unavailable: false,
    };
  }

  if (pathname === '/positions' && method === 'GET') return state.positions;

  const positionMatch = /^\/positions\/([^/]+)$/.exec(pathname);
  if (positionMatch && method === 'GET') {
    const marketId = decodeURIComponent(positionMatch[1]);
    const position = state.positions.find((candidate) => candidate.marketId === marketId);
    if (!position) fail(404, 'not_found', 'No position in this market.');
    return position;
  }

  if (pathname === '/trading/orders' && method === 'POST') return placeTrade(state, body);
  if (pathname === '/trading/sell' && method === 'POST') return sellPosition(state, body);

  // --- feed / search / leaderboard --------------------------------------
  if (pathname === '/feed' && method === 'GET')
    return paginateFeed(state, data.rawGuestFeed(state), params);
  if (pathname === '/feed/following' && method === 'GET') {
    return paginateFeed(state, data.rawGuestFollowingFeed(state), params);
  }
  if (pathname === '/feed/trending' && method === 'GET') {
    return paginateFeed(state, data.rawGuestFeed(state), params);
  }
  if (pathname === '/search' && method === 'GET') return data.guestSearch(params.get('q') ?? '');
  if (pathname === '/leaderboard' && method === 'GET') {
    return data.paginate(data.guestLeaderboard(), params.get('cursor') ?? undefined);
  }

  // --- calls / comments --------------------------------------------------
  if (pathname === '/calls' && method === 'POST') return createCall(state, body);

  const callMatch = /^\/calls\/([^/]+)(\/.*)?$/.exec(pathname);
  if (callMatch) {
    const callId = decodeURIComponent(callMatch[1]);
    const sub = callMatch[2];
    if (!sub && method === 'GET') {
      const item = data.findCallById(state, callId);
      rememberCall(callId, item);
      return data.applyCallOverlay(state, item);
    }
    if (!sub && method === 'DELETE') return deleteCall(state, callId);
    if (sub === '/like' && (method === 'POST' || method === 'DELETE')) {
      return toggleCallLike(state, callId, method === 'POST');
    }
    if (sub === '/comments' && method === 'GET') {
      return listComments(state, callId, params);
    }
    if (sub === '/comments' && method === 'POST') return createComment(state, callId, body);
    fail(404, 'not_found', `Unknown call route ${pathname}.`);
  }

  const commentMatch = /^\/comments\/([^/]+)(\/.*)?$/.exec(pathname);
  if (commentMatch) {
    const commentId = decodeURIComponent(commentMatch[1]);
    const sub = commentMatch[2];
    if (!sub && method === 'DELETE') return deleteComment(state, commentId);
    if (sub === '/replies' && method === 'GET') return listReplies(state, commentId, params);
    if (sub === '/like' && (method === 'POST' || method === 'DELETE')) {
      return toggleCommentLike(state, commentId, method === 'POST');
    }
    if (sub === '/share' && method === 'POST') return shareComment(state, commentId);
    fail(404, 'not_found', `Unknown comment route ${pathname}.`);
  }

  // --- users -------------------------------------------------------------
  if (pathname === '/users/suggestions' && method === 'GET') {
    return data.paginate(data.guestSuggestions(state), params.get('cursor') ?? undefined);
  }
  if (pathname === '/users/handle-available' && method === 'GET') {
    return guestHandleAvailability(state, params.get('handle') ?? '');
  }
  if (pathname === '/users/me/images' && method === 'POST') {
    return uploadProfileImage(state, params.get('kind'), rawBody);
  }
  if (pathname === '/users/me/images' && method === 'DELETE') {
    return removeProfileImage(state, params.get('kind'));
  }

  const userMatch = /^\/users\/([^/]+)(\/.*)?$/.exec(pathname);
  if (userMatch) {
    const userId = decodeURIComponent(userMatch[1]);
    const sub = userMatch[2];
    if (!sub && method === 'GET') {
      return userId === 'me' || userId === GUEST_USER_ID
        ? data.guestProfile(state)
        : data.otherUserProfile(state, userId);
    }
    if (!sub && method === 'PATCH') return updateProfile(state, userId, body);
    if (sub === '/calls' && method === 'GET') {
      return paginateFeed(state, data.rawGuestUserCalls(state, userId), params);
    }
    if (sub === '/replies' && method === 'GET') {
      return listUserReplies(state, userId, params);
    }
    if (sub === '/activity' && method === 'GET') {
      return data.paginate(data.guestActivity(state, userId), params.get('cursor') ?? undefined, 4);
    }
    if (sub === '/followers' && method === 'GET') {
      return data.paginate(
        data.guestFollowList(state, 'followers', userId),
        params.get('cursor') ?? undefined,
        6
      );
    }
    if (sub === '/following' && method === 'GET') {
      return data.paginate(
        data.guestFollowList(state, 'following', userId),
        params.get('cursor') ?? undefined,
        6
      );
    }
    if (sub === '/follow' && (method === 'POST' || method === 'DELETE')) {
      return toggleFollow(state, userId, method === 'POST');
    }
    fail(404, 'not_found', `Unknown user route ${pathname}.`);
  }

  fail(404, 'not_found', `Guest mode has no handler for ${method} ${pathname}.`);
}

function rememberCall(id: string, item: FeedItem): void {
  useGuestStore.setState((state) => ({ knownCalls: { ...state.knownCalls, [id]: item } }));
}

function paginateFeed(state: GuestState, items: FeedItem[], params: URLSearchParams) {
  const known = { ...state.knownCalls };
  for (const item of items) known[item.id] = item;
  useGuestStore.setState({ knownCalls: known });
  return data.paginate(
    items.map((item) => data.applyCallOverlay(state, item)),
    params.get('cursor') ?? undefined
  );
}

function listComments(state: GuestState, postId: string, params: URLSearchParams) {
  const items = data.rawGuestComments(state, postId);
  const known = { ...state.knownComments };
  for (const item of items) known[item.id] = item;
  useGuestStore.setState({ knownComments: known });
  return data.paginate(
    items.map((item) => data.applyCommentOverlay(state, item)),
    params.get('cursor') ?? undefined
  );
}

function listReplies(state: GuestState, commentId: string, params: URLSearchParams) {
  const postId = params.get('postId') ?? data.findCommentById(state, commentId)?.postId ?? '';
  const items = data.rawGuestReplies(state, commentId, postId);
  const known = { ...state.knownComments };
  for (const item of items) known[item.id] = item;
  useGuestStore.setState({ knownComments: known });
  return data.paginate(
    items.map((item) => data.applyCommentOverlay(state, item)),
    params.get('cursor') ?? undefined,
    4
  );
}

function listUserReplies(state: GuestState, userId: string, params: URLSearchParams) {
  const items = data.rawGuestUserReplies(state, userId);
  const known = { ...state.knownComments };
  for (const item of items) known[item.id] = item;
  useGuestStore.setState({ knownComments: known });
  return data.paginate(
    items
      .filter((item) => !state.deletedCommentIds.includes(item.id))
      .map((item) => data.applyCommentOverlay(state, item)),
    params.get('cursor') ?? undefined,
    4
  );
}

function createCall(state: GuestState, body: unknown): FeedItem {
  const input = body as Partial<CreateCallInput> | null;
  if (!input || typeof input.body !== 'string' || typeof input.positionId !== 'string') {
    fail(400, 'invalid_body', 'Expected { body, positionId }.');
  }
  const text = input.body.trim();
  if (text.length === 0 || text.length > MAX_BODY_LENGTH) {
    fail(400, 'invalid_body', `body must be 1-${MAX_BODY_LENGTH} characters.`);
  }

  const position = state.positions.find((candidate) => candidate.id === input.positionId);
  if (!position) {
    fail(403, 'forbidden_position', 'This position does not belong to the guest account.');
  }
  const market =
    state.markets[position.marketId] ??
    data.marketSummaryOf(data.guestMarketDetail(position.marketId));

  const createdAt = new Date().toISOString();
  const id = nextGuestId(state, 'call');
  const item: FeedItem = {
    id,
    author: data.guestUser(state),
    body: text,
    market,
    positionSnapshot: {
      marketId: position.marketId,
      outcome: position.outcome,
      choiceIndex: position.choiceIndex,
      entryPrice: position.entryPrice,
      size: position.size,
      capturedAt: createdAt,
    },
    likeCount: 0,
    commentCount: 0,
    liked: false,
    canDelete: true,
    createdAt,
  };

  useGuestStore.setState({
    createdCalls: [item, ...state.createdCalls],
    activity: [
      {
        id: nextGuestId(state, 'activity'),
        createdAt,
        type: 'CALL',
        postId: id,
        marketQuestion: market.question,
        outcome: position.outcome,
        choiceIndex: position.choiceIndex,
      },
      ...state.activity,
    ],
    nextId: state.nextId + 1,
  });
  return item;
}

function deleteCall(state: GuestState, callId: string): Record<string, never> {
  const item = state.createdCalls.find((candidate) => candidate.id === callId);
  if (item) {
    useGuestStore.setState({ deletedCallIds: [...state.deletedCallIds, callId] });
    return {};
  }
  const known = state.knownCalls[callId];
  if (known?.canDelete) {
    useGuestStore.setState({ deletedCallIds: [...state.deletedCallIds, callId] });
    return {};
  }
  fail(403, 'forbidden', 'Only Callouts you authored can be deleted.');
}

function toggleCallLike(state: GuestState, callId: string, liked: boolean) {
  const item = data.findCallById(state, callId);
  const current = state.callLikes[callId] ?? { liked: item.liked, likeCount: item.likeCount };
  const next = liked
    ? { liked: true, likeCount: current.liked ? current.likeCount : current.likeCount + 1 }
    : {
        liked: false,
        likeCount: current.liked ? Math.max(0, current.likeCount - 1) : current.likeCount,
      };

  useGuestStore.setState((previous) => ({
    callLikes: { ...previous.callLikes, [callId]: next },
    knownCalls: { ...previous.knownCalls, [callId]: item },
  }));
  return next;
}

function createComment(state: GuestState, postId: string, body: unknown): CommentItem {
  const input = body as Partial<CreateCommentInput> | null;
  if (!input || typeof input.body !== 'string') {
    fail(400, 'invalid_body', 'Expected { body }.');
  }
  const text = input.body.trim();
  if (text.length === 0 || text.length > MAX_BODY_LENGTH) {
    fail(400, 'invalid_body', `body must be 1-${MAX_BODY_LENGTH} characters.`);
  }

  let parentCommentId: string | null = null;
  if (input.parentCommentId) {
    const parent = data.findCommentById(state, input.parentCommentId);
    if (!parent) fail(404, 'not_found', 'Parent comment not found.');
    if (parent.postId !== postId)
      fail(400, 'invalid_parent', 'Parent comment must belong to this call.');
    parentCommentId = parent.id;
  }

  const createdAt = new Date().toISOString();
  const item: CommentItem = {
    id: nextGuestId(state, 'comment'),
    postId,
    author: data.guestUser(state),
    body: text,
    createdAt,
    canDelete: true,
    liked: false,
    likeCount: 0,
    shareCount: 0,
    replyCount: 0,
    parentCommentId,
  };

  useGuestStore.setState((previous) => ({
    comments: [item, ...previous.comments],
    knownComments: { ...previous.knownComments, [item.id]: item },
    nextId: previous.nextId + 1,
  }));
  return item;
}

function deleteComment(state: GuestState, commentId: string): Record<string, never> {
  const owned = state.comments.find((comment) => comment.id === commentId);
  // Fixture comments the profile views mark deletable for "me" are
  // removed by id too, so the UI's delete affordance always works.
  const known = state.knownComments[commentId];
  if (!owned && !known?.canDelete) {
    fail(403, 'forbidden', 'Only comments you authored can be deleted.');
  }
  useGuestStore.setState({ deletedCommentIds: [...state.deletedCommentIds, commentId] });
  return {};
}

function toggleCommentLike(state: GuestState, commentId: string, liked: boolean) {
  const item = data.findCommentById(state, commentId);
  if (!item) fail(404, 'not_found', 'Comment not found.');
  const current = state.commentLikes[commentId] ?? { liked: item.liked, likeCount: item.likeCount };
  const next = liked
    ? { liked: true, likeCount: current.liked ? current.likeCount : current.likeCount + 1 }
    : {
        liked: false,
        likeCount: current.liked ? Math.max(0, current.likeCount - 1) : current.likeCount,
      };

  useGuestStore.setState((previous) => ({
    commentLikes: { ...previous.commentLikes, [commentId]: next },
    knownComments: { ...previous.knownComments, [commentId]: item },
  }));
  return next;
}

function shareComment(state: GuestState, commentId: string) {
  const item = data.findCommentById(state, commentId);
  if (!item) fail(404, 'not_found', 'Comment not found.');
  const delta = (state.commentShares[commentId] ?? 0) + 1;
  useGuestStore.setState((previous) => ({
    commentShares: { ...previous.commentShares, [commentId]: delta },
    knownComments: { ...previous.knownComments, [commentId]: item },
  }));
  return { shareCount: item.shareCount + delta };
}

function placeTrade(state: GuestState, body: unknown): Order {
  const input = body as Partial<CreateTradeInput> | null;
  if (
    !input ||
    typeof input.marketId !== 'string' ||
    typeof input.choiceIndex !== 'number' ||
    typeof input.usdAmount !== 'number' ||
    !Number.isFinite(input.usdAmount) ||
    input.usdAmount <= 0
  ) {
    fail(400, 'invalid_body', 'Expected { marketId, choiceIndex, usdAmount }.');
  }
  if (input.usdAmount > state.balanceUsdc) {
    fail(400, 'insufficient_balance', 'Not enough demo USDC for this trade.');
  }

  const detail = data.guestMarketDetail(input.marketId);
  if (detail.closed || detail.resolved) {
    fail(400, 'market_closed', 'This market is no longer trading.');
  }
  const choice = detail.choices[input.choiceIndex];
  if (!choice || choice.price <= 0) {
    fail(400, 'invalid_body', 'Unknown choice for this market.');
  }

  const createdAt = new Date().toISOString();
  const id = nextGuestId(state, 'order');
  const shares = round((input.usdAmount * 100) / choice.price, 4);
  const order: Order = {
    id,
    userId: GUEST_USER_ID,
    marketId: input.marketId,
    outcome: choice.label,
    choiceIndex: input.choiceIndex,
    size: shares,
    price: choice.price,
    status: 'filled',
    createdAt,
  };

  useGuestStore.setState({
    balanceUsdc: round(state.balanceUsdc - input.usdAmount, 2),
    positions: [
      {
        id: nextGuestId(state, 'position'),
        marketId: input.marketId,
        marketQuestion: detail.question,
        outcome: choice.label,
        choiceIndex: input.choiceIndex,
        entryPrice: choice.price,
        currentPrice: choice.price,
        size: shares,
        openedAt: createdAt,
      },
      ...state.positions,
    ],
    orders: [order, ...state.orders],
    markets: { ...state.markets, [input.marketId]: data.marketSummaryOf(detail) },
    activity: [
      {
        id: nextGuestId(state, 'activity'),
        createdAt,
        type: 'TRADE',
        marketId: input.marketId,
        marketQuestion: detail.question,
        outcome: choice.label,
        choiceIndex: input.choiceIndex,
        usdAmount: input.usdAmount,
      },
      ...state.activity,
    ],
    tradingVolume: round(state.tradingVolume + input.usdAmount, 2),
    nextId: state.nextId + 1,
  });

  return order;
}

function sellPosition(state: GuestState, body: unknown) {
  const positionId = (body as { positionId?: unknown } | null)?.positionId;
  if (typeof positionId !== 'string') {
    fail(400, 'invalid_body', 'Expected { positionId }.');
  }
  const position = state.positions.find((candidate) => candidate.id === positionId);
  if (!position) fail(404, 'not_found', 'Position not found.');

  const price = position.currentPrice ?? position.entryPrice;
  const proceeds = round((position.size * price) / 100, 2);
  const createdAt = new Date().toISOString();
  const order: Order = {
    id: nextGuestId(state, 'order'),
    userId: GUEST_USER_ID,
    marketId: position.marketId,
    outcome: position.outcome,
    choiceIndex: position.choiceIndex,
    size: position.size,
    price,
    status: 'filled',
    createdAt,
  };

  useGuestStore.setState({
    positions: state.positions.filter((candidate) => candidate.id !== positionId),
    orders: [order, ...state.orders],
    balanceUsdc: round(state.balanceUsdc + proceeds, 2),
    activity: [
      {
        id: nextGuestId(state, 'activity'),
        createdAt,
        type: 'TRADE',
        marketId: position.marketId,
        marketQuestion: position.marketQuestion,
        outcome: position.outcome,
        choiceIndex: position.choiceIndex,
        usdAmount: proceeds,
      },
      ...state.activity,
    ],
    nextId: state.nextId + 1,
  });

  return {
    order,
    proceedsUsd: proceeds,
  };
}

function toggleFollow(state: GuestState, userId: string, following: boolean) {
  if (userId === 'me' || userId === GUEST_USER_ID) {
    fail(403, 'forbidden', 'You cannot follow yourself.');
  }
  const current = state.follows[userId] === true;
  const deltaChange = current === following ? 0 : following ? 1 : -1;

  const followed = MOCK_PEOPLE.find((person) => person.id === userId) ?? {
    id: userId,
    handle: userId,
    displayName: `User ${userId}`,
    avatarUrl: null,
    walletAddress: null,
  };

  useGuestStore.setState({
    follows: { ...state.follows, [userId]: following },
    followerDeltas: {
      ...state.followerDeltas,
      [userId]: (state.followerDeltas[userId] ?? 0) + deltaChange,
    },
    activity:
      following && deltaChange > 0
        ? [
            {
              id: nextGuestId(state, 'activity'),
              createdAt: new Date().toISOString(),
              type: 'FOLLOW' as const,
              followedUser: {
                id: followed.id,
                displayName: followed.displayName,
                handle: followed.handle,
              },
            },
            ...state.activity,
          ]
        : state.activity,
    nextId: state.nextId + (following && deltaChange > 0 ? 1 : 0),
  });

  const followerCount = 128 + (state.followerDeltas[userId] ?? 0) + deltaChange;
  return { following, followerCount };
}

/** Guest counterpart of `GET /users/handle-available` — same rules as
 * `updateProfile` below, checked against the sandbox's mock people. */
function guestHandleAvailability(state: GuestState, rawHandle: string): HandleAvailability {
  const handle = rawHandle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    return {
      handle,
      available: false,
      reason: 'invalid',
      message: 'Use 3-20 lowercase letters, numbers, or underscores.',
    };
  }
  if (handle === state.profile.handle) {
    return {
      handle,
      available: true,
      reason: 'current',
      message: 'This is your current username.',
    };
  }
  if (MOCK_PEOPLE.some((person) => person.handle === handle)) {
    return {
      handle,
      available: false,
      reason: 'taken',
      message: 'That username is already taken.',
    };
  }
  return { handle, available: true, reason: null, message: 'Username is available.' };
}

function updateProfile(state: GuestState, userId: string, body: unknown) {
  if (userId !== 'me') {
    fail(400, 'invalid_body', 'Only the guest profile ("me") can be edited.');
  }
  const input = body as Partial<UpdateProfileInput> | null;
  if (
    !input ||
    typeof input.displayName !== 'string' ||
    typeof input.handle !== 'string' ||
    typeof input.bio !== 'string'
  ) {
    fail(400, 'invalid_body', 'Expected { displayName, handle, bio, avatarUrl?, bannerUrl? }.');
  }

  const displayName = input.displayName.trim();
  if (displayName.length === 0 || displayName.length > 50) {
    fail(400, 'invalid_body', 'displayName must be 1-50 characters.');
  }
  const handle = input.handle.trim();
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    fail(400, 'invalid_body', 'handle must be 3-20 characters: a-z, 0-9, _');
  }
  if (handle !== state.profile.handle && MOCK_PEOPLE.some((person) => person.handle === handle)) {
    fail(409, 'handle_taken', 'That handle is already taken.');
  }
  const bio = input.bio.trim();
  if (bio.length > 160) {
    fail(400, 'invalid_body', 'bio must be at most 160 characters.');
  }

  useGuestStore.setState({
    profile: {
      ...state.profile,
      displayName,
      handle,
      bio: bio.length > 0 ? bio : null,
      avatarUrl: input.avatarUrl === undefined ? state.profile.avatarUrl : input.avatarUrl,
      bannerUrl: input.bannerUrl === undefined ? state.profile.bannerUrl : input.bannerUrl,
    },
  });
  return data.guestProfile(useGuestStore.getState());
}

function removeProfileImage(state: GuestState, kind: string | null) {
  const field = kind === 'banner' ? 'bannerUrl' : 'avatarUrl';
  useGuestStore.setState({ profile: { ...state.profile, [field]: null } });
  return data.guestProfile(useGuestStore.getState());
}

function uploadProfileImage(state: GuestState, kind: string | null, rawBody: unknown) {
  const field = kind === 'banner' ? 'bannerUrl' : 'avatarUrl';
  const uri = extractFormFileUri(rawBody);
  const next = uri ? { ...state.profile, [field]: uri } : state.profile;
  useGuestStore.setState({ profile: next });
  return data.guestProfile(useGuestStore.getState());
}

/** React Native's `FormData` uploads by reference — pull the local file
 * uri (or a web object URL) back out so the guest avatar/banner can
 * actually render the picked image. */
function extractFormFileUri(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const form = body as {
    get?: (name: string) => unknown;
    getParts?: () => { uri?: string }[];
    _parts?: [string, { uri?: string }][];
  };

  const parts = form.getParts?.() ?? form._parts?.map(([, value]) => value) ?? [];
  for (const part of parts) {
    if (part && typeof part.uri === 'string') return part.uri;
  }

  const file = form.get?.('file');
  if (file && typeof file === 'object' && typeof URL !== 'undefined' && URL.createObjectURL) {
    try {
      return URL.createObjectURL(file as Blob);
    } catch {
      return null;
    }
  }
  return null;
}
