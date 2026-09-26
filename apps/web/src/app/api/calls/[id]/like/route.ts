import { notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import type { LikeResult } from '@/types/social';

/** Recomputes `posts.like_count` from the `likes` table's actual row
 * count rather than a blind increment/decrement  slightly more work
 * per request, but immune to drift under a race or a retried request
 * (docs/DATABASE.md flags denormalized counters as a documented
 * consistency trade-off; this keeps the trade-off honest). */
async function syncLikeCount(postId: string): Promise<number> {
  const supabase = getSupabase();
  const { count } = await supabase.from('likes').select('user_id', { count: 'exact', head: true }).eq('post_id', postId);
  const likeCount = count ?? 0;
  await supabase.from('posts').update({ like_count: likeCount }).eq('id', postId);
  return likeCount;
}

async function assertPostExists(postId: string) {
  const supabase = getSupabase();
  const { data } = await supabase.from('posts').select('id').eq('id', postId).maybeSingle();
  if (!data) throw notFound(`Call ${postId} not found.`);
}

/** `POST /calls/:id/like`  who is derived from the authenticated
 * session, never client-supplied (docs/API.md). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await assertPostExists(id);

    const supabase = getSupabase();
    const { error } = await supabase
      .from('likes')
      .upsert({ user_id: viewer.id, post_id: id }, { onConflict: 'user_id,post_id' });
    if (error) throw error;

    const result: LikeResult = { liked: true, likeCount: await syncLikeCount(id) };
    return Response.json(result);
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await assertPostExists(id);

    const supabase = getSupabase();
    const { error } = await supabase.from('likes').delete().eq('user_id', viewer.id).eq('post_id', id);
    if (error) throw error;

    const result: LikeResult = { liked: false, likeCount: await syncLikeCount(id) };
    return Response.json(result);
  });
}
