import { withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { parseCursor } from '@/lib/pagination';
import { buildFeedItems, type PostRow } from '@/lib/social';
import type { Paginated } from '@/types/common';
import type { FeedItem } from '@/types/social';

/**
 * `GET /feed` — Home's "For You" tab. docs/API.md's intended ranking
 * is "recency + likes + comments + follow relationship + verified
 * position + market activity" (see docs/DECISIONS.md, "Feed Ranking
 * Is a Backend Responsibility") — that full weighted formula isn't
 * built in this pass; this orders by recency only, which is a strict
 * subset (a valid, if less engaging, ranking) rather than a
 * fabricated one. Revisit once there's enough real engagement data
 * for the other signals to mean anything.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const offset = parseCursor(url.searchParams.get('cursor'));
    const isTrending = url.searchParams.get('sort') === 'trending';
    const { data, error } = isTrending
      ? await getSupabase().rpc('trending_posts', { p_limit: 21, p_offset: offset })
      : await getSupabase().from('posts').select('*').order('created_at', { ascending: false }).range(offset, offset + 20);
    if (error) throw error;
    const rows = (data ?? []) as PostRow[];
    const postRows = rows.slice(0, 20);
    const pageCursor = rows.length > 20 ? String(offset + 20) : null;

    const items: FeedItem[] = await buildFeedItems(postRows, viewerUserRow?.id ?? null);
    const page: Paginated<FeedItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}
