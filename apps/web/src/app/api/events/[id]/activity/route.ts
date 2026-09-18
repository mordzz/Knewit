import { notFound, withErrorHandling } from '@/lib/apiError';
import { optionalAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { selectInChunks } from '@/lib/supabaseChunks';
import { fetchEventById } from '@/lib/polymarket/gammaClient';
import { buildFeedItems, type PostRow } from '@/lib/social';

const ACTIVITY_LIMIT = 20;

/** `GET /events/:id/activity` — the event's Callouts: Posts/Calls that
 * reference any of its child markets (docs/API.md). Not paginated — the
 * same fixed-batch contract `GET /markets/:id/activity` uses. Closed
 * children are still included here on purpose: their history is real
 * activity on the event. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      throw notFound(`Event ${id} not found.`);
    }

    const event = await fetchEventById(id);
    if (!event) {
      throw notFound(`Event ${id} not found.`);
    }

    const marketIds = event.markets.map((market) => market.id);
    if (marketIds.length === 0) return Response.json([]);

    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    // Batched: hundreds of child markets would blow the request URL limit
    // in one `.in(...)`, and a failed query must surface as an error, not
    // as "no callouts".
    const postRows = await selectInChunks<PostRow>(marketIds, (batch) =>
      getSupabase().from('posts').select('*').in('market_id', batch)
    );
    postRows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    const items = await buildFeedItems(postRows.slice(0, ACTIVITY_LIMIT), viewerUserRow?.id ?? null);
    return Response.json(items);
  });
}
