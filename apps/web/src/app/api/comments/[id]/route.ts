import { ApiError, notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { optionalAuth } from '@/lib/privy';
import { buildCommentItems, buildFeedItems, type CommentRow, type PostRow } from '@/lib/social';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const supabase = getSupabase();
    const { data: row } = await supabase.from('comments').select('*').eq('id', id).maybeSingle();
    if (!row) throw notFound(`Comment ${id} not found.`);
    const { data: post } = await supabase.from('posts').select('*').eq('id', row.post_id).maybeSingle();
    if (!post) throw notFound(`Callout ${row.post_id} not found.`);
    const viewer = await optionalAuth(request);
    const viewerUser = viewer ? await getOrCreateUser(viewer.privyUserId) : null;
    const [comment] = await buildCommentItems([row as CommentRow], viewerUser?.id ?? null);
    const [callout] = await buildFeedItems([post as PostRow], viewerUser?.id ?? null);
    return Response.json({ comment, callout });
  });
}

/** `DELETE /comments/:id`  the backend independently verifies
 * ownership (docs/API.md); returns `{}` rather than a bare 204 since
 * the mobile client's `apiRequest` always calls `response.json()`. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const supabase = getSupabase();
    const { data: comment } = await supabase.from('comments').select('id, post_id, author_id').eq('id', id).maybeSingle();
    if (!comment) throw notFound(`Comment ${id} not found.`);
    if (comment.author_id !== viewer.id) {
      throw new ApiError(403, 'forbidden', 'You can only delete your own comments.');
    }

    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;

    const { count } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', comment.post_id);
    await supabase.from('posts').update({ comment_count: count ?? 0 }).eq('id', comment.post_id);

    return Response.json({});
  });
}
