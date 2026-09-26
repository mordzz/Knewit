import { notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import type { LikeResult } from '@/types/social';

async function syncCommentLikeCount(commentId: string): Promise<number> {
  const supabase = getSupabase();
  const { count } = await supabase
    .from('comment_likes')
    .select('user_id', { count: 'exact', head: true })
    .eq('comment_id', commentId);
  const likeCount = count ?? 0;
  await supabase.from('comments').update({ like_count: likeCount }).eq('id', commentId);
  return likeCount;
}

async function assertCommentExists(commentId: string) {
  const supabase = getSupabase();
  const { data } = await supabase.from('comments').select('id').eq('id', commentId).maybeSingle();
  if (!data) throw notFound(`Comment ${commentId} not found.`);
}

/** `POST /comments/:id/like`  mirrors `calls/[id]/like/route.ts` for
 * comments instead of posts. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await assertCommentExists(id);

    const supabase = getSupabase();
    const { error } = await supabase
      .from('comment_likes')
      .upsert({ user_id: viewer.id, comment_id: id }, { onConflict: 'user_id,comment_id' });
    if (error) throw error;

    const result: LikeResult = { liked: true, likeCount: await syncCommentLikeCount(id) };
    return Response.json(result);
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await assertCommentExists(id);

    const supabase = getSupabase();
    const { error } = await supabase.from('comment_likes').delete().eq('user_id', viewer.id).eq('comment_id', id);
    if (error) throw error;

    const result: LikeResult = { liked: false, likeCount: await syncCommentLikeCount(id) };
    return Response.json(result);
  });
}
