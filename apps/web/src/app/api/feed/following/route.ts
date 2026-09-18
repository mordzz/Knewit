import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { fetchPage, parseCursor } from '@/lib/pagination';
import { buildFeedItems, type PostRow } from '@/lib/social';
import type { Paginated } from '@/types/common';
import type { FeedItem } from '@/types/social';

/** `GET /feed/following` — Posts/Calls from accounts the caller
 * follows; requires authentication (the endpoint is inherently about
 * "who you follow"). An authenticated caller who follows no one gets
 * an honestly empty page, never fabricated content. */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const supabase = getSupabase();
    const { data: followedRows } = await supabase.from('follows').select('following_id').eq('follower_id', viewer.id);
    const followedIds = (followedRows ?? []).map((r) => r.following_id as string);

    if (followedIds.length === 0) {
      const page: Paginated<FeedItem> = { items: [], nextCursor: null };
      return Response.json(page);
    }

    const offset = parseCursor(url.searchParams.get('cursor'));
    const { items: postRows, nextCursor: pageCursor } = await fetchPage<PostRow>(
      supabase.from('posts').select('*').in('author_id', followedIds).order('created_at', { ascending: false }),
      offset
    );

    const items: FeedItem[] = await buildFeedItems(postRows, viewer.id);
    const page: Paginated<FeedItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}
