import { ApiError, notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';

/** `DELETE /comments/:id` — the backend independently verifies
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
