import { getSupabase } from '@/lib/supabase';
import { getCachedOrLiveMarketSummary } from '@/features/markets/lib/marketCache';
import { fetchPolymarketStanding } from '@/lib/leaderboard';
import type { DbUser } from '@/lib/users';
import type { CommentItem, FeedItem, PositionSnapshot, User, UserProfile } from '@/types/social';

export interface PostRow {
  id: string;
  author_id: string;
  body: string;
  market_id: string | null;
  position_snapshot_market_id: string | null;
  position_snapshot_outcome: string | null;
  position_snapshot_choice_index: number | null;
  position_snapshot_entry_price: number | null;
  position_snapshot_size: number | null;
  position_snapshot_captured_at: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  like_count: number;
  share_count: number;
  created_at: string;
}

export function toPublicUser(user: DbUser): User {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    walletAddress: user.wallet_address,
  };
}

export async function buildUserProfile(target: DbUser, viewerUserId: string | null): Promise<UserProfile> {
  const [stats, standing] = await Promise.all([
    fetchProfileStats(target.id, viewerUserId),
    // This account's live Polymarket standing  the *same* ranking the
    // Leaderboard shows (docs/DECISIONS.md, "Profile Trading Metric
    // Matches Leaderboard's Definition Exactly"), asked of Polymarket by
    // wallet address rather than summed from our own `orders` rows (which
    // have none). `null` when there's no wallet, no ranked volume, or the
    // lookup fails  never guessed.
    fetchPolymarketStanding(target.wallet_address),
  ]);

  return {
    ...toPublicUser(target),
    bio: target.bio,
    bannerUrl: target.banner_url,
    followerCount: stats.followerCount,
    followingCount: stats.followingCount,
    callCount: stats.callCount,
    isFollowing: stats.isFollowing,
    isSelf: viewerUserId === target.id,
    tradingVolume: standing?.volume ?? null,
  };
}

interface ProfileStats {
  followerCount: number;
  followingCount: number;
  callCount: number;
  isFollowing: boolean;
}

interface ProfileStatsRow {
  follower_count: number;
  following_count: number;
  call_count: number;
  is_following: boolean;
}

/** Counts + viewer-relative follow state in **one** query  the
 * `user_profile_stats` SQL function (migration `0010_single_query_reads.sql`)
 * replaces the old three count queries plus an existence read
 * (docs/DECISIONS.md, "Single-Query Read Paths"). */
export async function fetchProfileStats(
  userId: string,
  viewerUserId: string | null
): Promise<ProfileStats> {
  const { data, error } = await getSupabase().rpc('user_profile_stats', {
    p_user_id: userId,
    p_viewer_id: viewerUserId,
  });
  if (error) throw error;

  const row = (data ?? [])[0] as ProfileStatsRow | undefined;
  return {
    followerCount: Number(row?.follower_count ?? 0),
    followingCount: Number(row?.following_count ?? 0),
    callCount: Number(row?.call_count ?? 0),
    isFollowing: Boolean(row?.is_following),
  };
}

interface ProfileOverviewRow extends DbUser {
  follower_count: number;
  following_count: number;
  call_count: number;
  is_following: boolean;
}

/**
 * The whole profile read in **one** query (`user_profile_overview`,
 * migration `0010_single_query_reads.sql`): user row + counts +
 * `isFollowing`, `null` when the id doesn't exist. `GET /users/:id` uses
 * this directly instead of a target select followed by `buildUserProfile`.
 */
export async function fetchUserProfile(
  targetId: string,
  viewerUserId: string | null
): Promise<UserProfile | null> {
  const { data, error } = await getSupabase().rpc('user_profile_overview', {
    p_user_id: targetId,
    p_viewer_id: viewerUserId,
  });
  if (error) throw error;

  const row = (data ?? [])[0] as ProfileOverviewRow | undefined;
  if (!row) return null;

  const standing = await fetchPolymarketStanding(row.wallet_address);

  return {
    ...toPublicUser(row),
    bio: row.bio,
    bannerUrl: row.banner_url,
    followerCount: Number(row.follower_count ?? 0),
    followingCount: Number(row.following_count ?? 0),
    callCount: Number(row.call_count ?? 0),
    isFollowing: Boolean(row.is_following),
    isSelf: viewerUserId === row.id,
    tradingVolume: standing?.volume ?? null,
  };
}

function toPositionSnapshot(post: PostRow): PositionSnapshot | null {
  if (!post.position_snapshot_market_id) return null;
  return {
    marketId: post.position_snapshot_market_id,
    outcome: post.position_snapshot_outcome as string,
    choiceIndex: post.position_snapshot_choice_index ?? 0,
    entryPrice: post.position_snapshot_entry_price as number,
    size: post.position_snapshot_size as number,
    capturedAt: post.position_snapshot_captured_at as string,
  };
}

/**
 * Batch-expands `Post` rows into `FeedItem`s for list endpoints (feed,
 * user posts/calls)  fetches authors/likes/markets with `.in(...)`
 * queries instead of one round-trip per row. A single-item read (`GET
 * /calls/:id`) calls this with a one-element array; the batching still
 * pays off there since it's the same code path either way.
 */
export async function buildFeedItems(posts: PostRow[], viewerUserId: string | null): Promise<FeedItem[]> {
  if (posts.length === 0) return [];
  const supabase = getSupabase();

  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const marketIds = Array.from(new Set(posts.map((p) => p.market_id).filter((id): id is string => id !== null)));

  const [{ data: authorRows }, likedPostIds, marketSummaries] = await Promise.all([
    supabase.from('users').select('*').in('id', authorIds),
    viewerUserId
      ? supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', viewerUserId)
          .in(
            'post_id',
            posts.map((p) => p.id)
          )
          .then(({ data }) => new Set((data ?? []).map((row) => row.post_id as string)))
      : Promise.resolve(new Set<string>()),
    Promise.all(marketIds.map((id) => getCachedOrLiveMarketSummary(id))),
  ]);

  const authorsById = new Map((authorRows ?? []).map((row) => [row.id as string, row as DbUser]));
  const marketsById = new Map(marketIds.map((id, i) => [id, marketSummaries[i]]));

  return posts.map((post) => {
    const author = authorsById.get(post.author_id);
    return {
      id: post.id,
      author: author ? toPublicUser(author) : { id: post.author_id, handle: 'unknown', displayName: 'Unknown', avatarUrl: null, walletAddress: null },
      body: post.body,
      market: post.market_id ? (marketsById.get(post.market_id) ?? null) : null,
      positionSnapshot: toPositionSnapshot(post),
      likeCount: post.like_count,
      commentCount: post.comment_count,
      liked: likedPostIds.has(post.id),
      canDelete: viewerUserId === post.author_id,
      createdAt: post.created_at,
    };
  });
}

export async function buildCommentItems(
  comments: CommentRow[],
  viewerUserId: string | null
): Promise<CommentItem[]> {
  if (comments.length === 0) return [];
  const supabase = getSupabase();

  const authorIds = Array.from(new Set(comments.map((c) => c.author_id)));
  const topLevelIds = comments.filter((c) => !c.parent_comment_id).map((c) => c.id);

  const [{ data: authorRows }, likedCommentIds, { data: replyRows }] = await Promise.all([
    supabase.from('users').select('*').in('id', authorIds),
    viewerUserId
      ? supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', viewerUserId)
          .in(
            'comment_id',
            comments.map((c) => c.id)
          )
          .then(({ data }) => new Set((data ?? []).map((row) => row.comment_id as string)))
      : Promise.resolve(new Set<string>()),
    topLevelIds.length > 0
      ? supabase.from('comments').select('parent_comment_id').in('parent_comment_id', topLevelIds)
      : Promise.resolve({ data: [] as Array<{ parent_comment_id: string }> }),
  ]);

  const authorsById = new Map((authorRows ?? []).map((row) => [row.id as string, row as DbUser]));
  const replyCounts = new Map<string, number>();
  for (const row of replyRows ?? []) {
    const parentId = row.parent_comment_id as string;
    replyCounts.set(parentId, (replyCounts.get(parentId) ?? 0) + 1);
  }

  return comments.map((comment) => {
    const author = authorsById.get(comment.author_id);
    return {
      id: comment.id,
      postId: comment.post_id,
      author: author ? toPublicUser(author) : { id: comment.author_id, handle: 'unknown', displayName: 'Unknown', avatarUrl: null, walletAddress: null },
      body: comment.body,
      createdAt: comment.created_at,
      canDelete: viewerUserId === comment.author_id,
      liked: likedCommentIds.has(comment.id),
      likeCount: comment.like_count,
      shareCount: comment.share_count,
      replyCount: comment.parent_comment_id ? 0 : (replyCounts.get(comment.id) ?? 0),
      parentCommentId: comment.parent_comment_id,
    };
  });
}
