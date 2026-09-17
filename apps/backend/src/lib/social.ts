import { getSupabase } from '@/lib/supabase';
import { getCachedOrLiveMarketSummary } from '@/lib/marketCache';
import { fetchPolymarketStanding } from '@/lib/leaderboard';
import type { DbUser } from '@/lib/users';
import type { CommentItem, FeedItem, PositionSnapshot, User, UserProfile } from '@/types/social';

export interface PostRow {
  id: string;
  author_id: string;
  body: string;
  market_id: string | null;
  position_snapshot_market_id: string | null;
  position_snapshot_outcome: 'YES' | 'NO' | null;
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
  const supabase = getSupabase();

  const [followerCount, followingCount, postCount, callCount, standing] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', target.id),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', target.id),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', target.id)
      .is('position_snapshot_market_id', null),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', target.id)
      .not('position_snapshot_market_id', 'is', null),
    fetchPolymarketStanding(target.wallet_address),
  ]);

  let isFollowing = false;
  if (viewerUserId && viewerUserId !== target.id) {
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', viewerUserId)
      .eq('following_id', target.id)
      .maybeSingle();
    isFollowing = Boolean(data);
  }

  return {
    ...toPublicUser(target),
    bio: target.bio,
    followerCount: followerCount.count ?? 0,
    followingCount: followingCount.count ?? 0,
    postCount: postCount.count ?? 0,
    callCount: callCount.count ?? 0,
    isFollowing,
    isSelf: viewerUserId === target.id,
    // This account's live Polymarket standing — the *same* ranking the
    // Leaderboard shows (docs/DECISIONS.md, "Profile Trading Metric
    // Matches Leaderboard's Definition Exactly"), asked of Polymarket by
    // wallet address rather than summed from our own `orders` rows (which
    // have none). `null` when there's no wallet, no ranked volume, or the
    // lookup fails — never guessed.
    tradingVolume: standing?.volume ?? null,
    leaderboardRank: standing?.rank ?? null,
  };
}

function toPositionSnapshot(post: PostRow): PositionSnapshot | null {
  if (!post.position_snapshot_market_id) return null;
  return {
    marketId: post.position_snapshot_market_id,
    outcome: post.position_snapshot_outcome as 'YES' | 'NO',
    entryPrice: post.position_snapshot_entry_price as number,
    size: post.position_snapshot_size as number,
    capturedAt: post.position_snapshot_captured_at as string,
  };
}

/**
 * Batch-expands `Post` rows into `FeedItem`s for list endpoints (feed,
 * user posts/calls) — fetches authors/likes/markets with `.in(...)`
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
