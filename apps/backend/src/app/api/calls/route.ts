import { ApiError, badRequest, notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { getAndCacheMarketSummary } from '@/lib/marketCache';
import { buildFeedItems, type PostRow } from '@/lib/social';
import type { CreatePostInput } from '@/types/social';

/**
 * `POST /calls` — create a Post, or a position-backed Call when
 * `positionId` is given. The client never sends an entry price/size/
 * outcome/snapshot — this backend resolves `positionId` against its
 * own `Position` table and writes the immutable snapshot itself
 * (docs/API.md, "Client Never Sends a Position Snapshot"). `Position`
 * has no rows yet (Phase 3 builds trading), so any `positionId`
 * currently resolves to "not found" — an honest rejection, not a
 * fabricated snapshot.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<CreatePostInput> | null;
    if (!body || typeof body.body !== 'string' || body.body.trim().length === 0) {
      throw badRequest('Expected { body: string, positionId?: string }.');
    }

    const supabase = getSupabase();
    let marketId: string | null = null;
    let snapshot: {
      position_snapshot_market_id: string;
      position_snapshot_outcome: 'YES' | 'NO';
      position_snapshot_entry_price: number;
      position_snapshot_size: number;
      position_snapshot_captured_at: string;
    } | null = null;

    if (body.positionId) {
      const { data: position } = await supabase
        .from('positions')
        .select('*')
        .eq('id', body.positionId)
        .maybeSingle();
      if (!position) {
        throw notFound(`Position ${body.positionId} not found.`);
      }
      if (position.user_id !== viewer.id) {
        throw new ApiError(403, 'forbidden_position', 'This position does not belong to you.');
      }

      const marketSummary = await getAndCacheMarketSummary(position.market_id);
      if (!marketSummary) {
        throw notFound(`Market ${position.market_id} for this position no longer exists.`);
      }

      marketId = position.market_id;
      snapshot = {
        position_snapshot_market_id: position.market_id,
        position_snapshot_outcome: position.outcome,
        position_snapshot_entry_price: position.entry_price,
        position_snapshot_size: position.size,
        position_snapshot_captured_at: new Date().toISOString(),
      };
    }

    const { data: created, error } = await supabase
      .from('posts')
      .insert({
        author_id: viewer.id,
        body: body.body,
        market_id: marketId,
        ...snapshot,
      })
      .select('*')
      .single();
    if (error) throw error;

    const [feedItem] = await buildFeedItems([created as PostRow], viewer.id);
    return Response.json(feedItem, { status: 201 });
  });
}
