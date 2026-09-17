import { notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { buildFeedItems, type PostRow } from '@/lib/social';

/** `GET /calls/:id` — a single Post/Call (Post Detail / Call Detail). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const supabase = getSupabase();
    const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
    if (!post) throw notFound(`Call ${id} not found.`);

    const [feedItem] = await buildFeedItems([post as PostRow], viewerUserRow?.id ?? null);
    return Response.json(feedItem);
  });
}
