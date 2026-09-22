import type { Category, ID, ISODateString } from '@/types/common';
import type { MarketChoice, Outcome } from '@/types/market';

/**
 * Frozen at Call-creation time from the user's live Polymarket position.
 * Never edited after creation — see docs/SOCIAL-FEATURE.md.
 */
export interface PositionSnapshot {
  marketId: ID;
  /** The choice's label at capture time ("Yes", "Manchester City", ...). */
  outcome: string;
  choiceIndex: number;
  entryPrice: number; // cents
  size: number; // shares
  capturedAt: ISODateString;
}

/**
 * The API/rendering shape of a user's position — includes the market's
 * question so a position card never needs a second market lookup,
 * mirroring `FeedItem`/`MarketSummary`'s own "expanded shape for
 * rendering, normalized shape for storage" split (`Position` in
 * `types/market.ts` remains the normalized entity). `currentPrice` is
 * nullable: it reflects whatever price the backend/Polymarket returned
 * at fetch time, but a screen already showing the same market's live
 * price (Market Detail) should prefer that over this field rather than
 * risk two slightly-differently-timed numbers disagreeing on screen —
 * see docs/DECISIONS.md.
 */
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
  openedAt: ISODateString;
}

export interface User {
  id: ID;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string | null;
}

/**
 * What the mobile app sends to create a Callout. `positionId` is
 * **required** — there is only a Callout now, and it always attaches a
 * held position (docs/DECISIONS.md, "Callouts Require a Held
 * Position"); the backend rejects a request without one. `positionId`
 * is the *only* position information the client ever sends: never
 * `entryPrice`, `size`, or a `verified` flag. The backend resolves
 * ownership, fetches the authoritative position, and builds the
 * immutable snapshot itself — a client-supplied snapshot would defeat
 * the entire point of "verified" (see docs/DECISIONS.md, "Client Is
 * Never the Snapshot Source of Truth").
 */
export interface CreateCallInput {
  body: string;
  positionId: string;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  body: string;
  createdAt: ISODateString;
}

/**
 * The API/rendering shape of a comment — `author` expanded (same
 * "normalized entity vs. expanded read shape" split as `Post`/`FeedItem`).
 * `canDelete` is server-computed — whether the *authenticated viewer*
 * (not necessarily anyone reading these docs) authored this comment.
 * The client never derives ownership itself by comparing ids: it has no
 * reliable local copy of "my own user id" (`authStore.user` stays
 * `null` until a real backend exists — see docs/WALLET.md), and even if
 * it did, deriving an authorization decision client-side would just be
 * a UI convenience, never the actual security boundary (the backend
 * must independently reject an unauthorized delete regardless of what
 * the client shows) — see docs/DECISIONS.md.
 */
/**
 * Replies are one level deep, not a recursive tree: a reply's
 * `parentCommentId` always points at the top-level comment its thread
 * belongs to, even when the user tapped "Reply" on another reply — see
 * docs/DECISIONS.md ("One Reply Level"). `liked`/`likeCount` follow the
 * same viewer-relative/server-computed convention as `FeedItem.liked`.
 * `shareCount` is genuinely persisted (unlike a Post/Call's Share, which
 * carries no count — see docs/DECISIONS.md, "Native Share, Not In-App
 * Repost"): every comment share is counted, via the same
 * optimistic-mutation pattern as Like (`useShareComment`).
 */
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
  /** Direct replies only, not a recursive total. Always `0` on a reply
   * itself — replies don't have their own reply count/thread. */
  replyCount: number;
  /** `null` for a top-level comment. Set to the top-level comment's id
   * for a reply (never another reply's id — see "One Reply Level"). */
  parentCommentId: ID | null;
}

/** `postId` travels in the URL path (`endpoints.comments`), not the
 * body. `parentCommentId` is omitted for a top-level comment; set it to
 * reply within an existing thread — the backend rejects (or this
 * client never sends) a `parentCommentId` that isn't itself a
 * top-level comment, per "One Reply Level" (docs/DECISIONS.md). */
export interface CreateCommentInput {
  body: string;
  parentCommentId?: ID;
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

/** A comment share has no "unshare" — this is an increment-only count,
 * unlike `LikeResult`'s toggle. See docs/DECISIONS.md. */
export interface ShareResult {
  shareCount: number;
}

export interface FollowResult {
  following: boolean;
  followerCount: number;
}

/**
 * The expanded profile shape `GET /users/:id` returns — `User`'s public
 * fields plus social counts and the viewer-relative `isFollowing`. Never
 * includes anything private (wallet balance, email, auth identifiers)
 * — see docs/DECISIONS.md.
 */
export interface UserProfile extends User {
  bio: string | null;
  followerCount: number;
  followingCount: number;
  callCount: number;
  isFollowing: boolean;
  /** Server-computed: true when this profile belongs to the
   * authenticated viewer themselves — same reasoning as `isFollowing`/
   * `CommentItem.canDelete`: the client has no reliable local copy of
   * "my own user id" to compare against (see docs/DECISIONS.md), so
   * "is this me?" is answered server-side, not derived client-side. */
  isSelf: boolean;
  /** Trading Volume — the exact same metric/definition as Sprint 10's
   * Leaderboard (`LeaderboardMetric`, `name: 'volume'`), never a
   * separately-defined "profit" or "PnL" figure — see
   * docs/DECISIONS.md ("Profile Trading Metric Matches Leaderboard's
   * Definition Exactly"). `null` when unavailable — never estimated. */
  tradingVolume: number | null;
  /** Public URL of the profile banner (Supabase Storage), or `null` when
   * the user hasn't uploaded one — the UI renders a soft gradient
   * placeholder in that case. */
  bannerUrl: string | null;
}

/** Editable profile fields. `handle` must be lowercase, 3-20 chars,
 * `a-z0-9_` only; the backend enforces uniqueness against Knewit accounts
 * and Polymarket leaderboard names.
 * `avatarUrl`/`bannerUrl` are optional: omit to keep the current image,
 * `null` to clear it — only URLs from this app's own profile-image
 * storage are accepted (docs/API.md). */
export interface UpdateProfileInput {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

/**
 * One row of a Followers/Following list — a smaller shape than
 * `UserProfile` (no bio/counts), since a list of dozens of rows only
 * ever needs enough to render a compact row + Follow button. Same
 * viewer-relative-fields-are-server-computed rule as everywhere else.
 */
export interface FollowListItem {
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  isFollowing: boolean;
  isSelf: boolean;
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
 * twice. `isBinary` means the market's choices are literally
 * "Yes"/"No" (the only case the app's green/red color pair maps to
 * meaning); `choices` is what every UI renders, whatever the market's
 * own outcome labels are — see docs/DECISIONS.md ("Trading Any
 * Polymarket Choice").
 */
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
  yesPrice: number; // cents — choices[0]'s price, kept for legacy readers
  noPrice: number; // cents — choices[1]'s price, kept for legacy readers
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
  choices: MarketChoice[];
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
 * The feed/API rendering shape of a Callout — `author`/`market` are
 * expanded objects (not just ids) since that's what a feed response
 * realistically returns — see docs/DATABASE.md and docs/API.md.
 *
 * `liked` is server-computed and viewer-relative (Sprint 9) — whether
 * *the authenticated requester* has liked this Callout, not a fact about
 * the Callout itself. Same reasoning as `CommentItem.canDelete` — see
 * docs/DECISIONS.md.
 */
export interface FeedItem {
  id: ID;
  author: User;
  body: string;
  market: MarketSummary | null;
  positionSnapshot: PositionSnapshot | null;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  /** Server-computed — whether the *authenticated viewer* authored this
   * Callout and may delete it. Same rule as `CommentItem.canDelete`: the
   * client never derives ownership itself, and the backend independently
   * enforces author-only on `DELETE /calls/:id` — see docs/DECISIONS.md. */
  canDelete: boolean;
  createdAt: ISODateString;
}

/**
 * Market Detail's richer shape — every field `MarketSummary` has, plus
 * ones only a full detail page needs (`rules`, `openedAt`). A superset
 * rather than a sibling type, so anything that only needs summary
 * fields (`MarketAttachment`, `MarketCard`) still works unchanged when
 * handed a `MarketDetail` — see docs/DECISIONS.md (Market Detail
 * rebuild).
 */
export interface MarketDetail extends MarketSummary {
  rules: string | null;
  openedAt: ISODateString | null;
  /** Only meaningful once `resolved` is true — the settled outcome,
   * shown in the "Resolution" section. `null` while unresolved, or if a
   * resolved market's outcome genuinely isn't known yet — see
   * docs/DECISIONS.md (Sprint 5). */
  resolvedOutcome: Outcome | null;
}

/**
 * One row in a market's Top Holders list — a user's current binary
 * position size in this specific market, for display only. Distinct
 * from `Position` (`types/market.ts`), which is a full trading record;
 * this is the read-only, other-people's-holdings view Market Detail
 * shows, closer to Polymarket's own public "Positions" list than to our
 * own position-tracking model.
 */
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
 * ordinary `MarketSummary` with its own `label`.
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
 * lookup. */
export interface EventHolderRow {
  id: ID;
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  marketId: ID;
  marketLabel: string;
  outcome: string;
  shares: number;
}

/** Polymarket's own set of chart time windows — see docs/DECISIONS.md
 * ("Market Price Chart"). */
export type PriceRange = '1H' | '6H' | '1D' | '1W' | '1M' | 'ALL';

/**
 * One point of a market's YES-price history — `price` is cents, the
 * same unit as `MarketSummary.yesPrice`, so the chart's most recent
 * point always agrees with whatever live price the rest of the screen
 * shows (never a second, differently-scaled number for the same thing
 * — see docs/DECISIONS.md).
 */
export interface PricePoint {
  timestamp: ISODateString;
  price: number;
}
