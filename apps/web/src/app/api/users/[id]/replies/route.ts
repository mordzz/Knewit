import { notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser, resolveTargetUserId } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { fetchPage, parseCursor } from '@/lib/pagination';
import { buildCommentItems, type CommentRow } from '@/lib/social';
import type { Paginated } from '@/types/common';
import type { CommentItem } from '@/types/social';

/** `GET /users/:id/replies`  comments this user has made on any
 * Post/Call (both top-level and nested), newest first. Mirrors
 * `posts/route.ts`/`calls/route.ts`'s shape one level down: same
 * target-resolution/pagination, querying `comments` instead of
 * `posts`. Backs the profile's "Replies" tab (renamed from "Posts"
 * a plain, position-less Post already surfaces on the "Calls" tab's
 * sibling feed via `GET /feed`/the post's own detail page, so a
 * second "Posts" tab here just duplicated that; "Replies," like on
 * X, is the one piece of this user's own activity that had no profile
 * surface at all before this). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;
    const targetId = await resolveTargetUserId(id, viewer?.privyUserId ?? null);

    const supabase = getSupabase();
    const { data: target } = await supabase.from('users').select('id').eq('id', targetId).maybeSingle();
    if (!target) throw notFound(`User ${id} not found.`);

    const offset = parseCursor(url.searchParams.get('cursor'));
    const { items: commentRows, nextCursor: pageCursor } = await fetchPage<CommentRow>(
      supabase.from('comments').select('*').eq('author_id', targetId).order('created_at', { ascending: false }),
      offset
    );

    const items: CommentItem[] = await buildCommentItems(commentRows, viewerUserRow?.id ?? null);
    const page: Paginated<CommentItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}
