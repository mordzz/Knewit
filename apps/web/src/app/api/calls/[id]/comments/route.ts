import { badRequest, notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth, requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { fetchPage, parseCursor } from '@/lib/pagination';
import { buildCommentItems, type CommentRow } from '@/lib/social';
import type { Paginated } from '@/types/common';
import type { CommentItem, CreateCommentInput } from '@/types/social';

async function assertPostExists(postId: string) {
  const supabase = getSupabase();
  const { data } = await supabase.from('posts').select('id').eq('id', postId).maybeSingle();
  if (!data) throw notFound(`Call ${postId} not found.`);
}

/** `GET /calls/:id/comments`  top-level comments only (newest-first,
 * no client-side re-sorting, docs/API.md); replies live behind
 * `GET /comments/:id/replies`  see that route. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    await assertPostExists(id);

    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const offset = parseCursor(url.searchParams.get('cursor'));
    const { items: rows, nextCursor: pageCursor } = await fetchPage<CommentRow>(
      getSupabase()
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false }),
      offset
    );

    const items: CommentItem[] = await buildCommentItems(rows, viewerUserRow?.id ?? null);
    const page: Paginated<CommentItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}

/**
 * `POST /calls/:id/comments`  the backend derives the author from the
 * session. `parentCommentId`, when set, may reference any comment in the
 * same callout, allowing arbitrarily nested reply threads.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    await assertPostExists(id);

    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<CreateCommentInput> | null;
    if (!body || typeof body.body !== 'string' || body.body.trim().length === 0) {
      throw badRequest('Expected { body: string, parentCommentId?: string }.');
    }

    const supabase = getSupabase();
    if (body.parentCommentId) {
      const { data: parent } = await supabase
        .from('comments')
        .select('id, post_id, parent_comment_id')
        .eq('id', body.parentCommentId)
        .maybeSingle();
      if (!parent || parent.post_id !== id) throw badRequest('parentCommentId must belong to this same call.');
      if (parent.id === body.parentCommentId) throw badRequest('A comment cannot reply to itself.');
    }

    const { data: created, error } = await supabase
      .from('comments')
      .insert({
        post_id: id,
        author_id: viewer.id,
        parent_comment_id: body.parentCommentId ?? null,
        body: body.body,
      })
      .select('*')
      .single();
    if (error) throw error;

    // Re-derived from the actual row count rather than a blind
    // increment  same never-drift approach as `like/route.ts::syncLikeCount`.
    const { count } = await supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', id);
    await supabase.from('posts').update({ comment_count: count ?? 0 }).eq('id', id);

    const [item] = await buildCommentItems([created as CommentRow], viewer.id);
    return Response.json(item, { status: 201 });
  });
}
