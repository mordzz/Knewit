import { badRequest, notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { getAndCacheMarketSummary } from '@/features/markets/lib/marketCache';
import { buildFeedItems, type PostRow } from '@/lib/social';
import { getUserPortfolio } from '@/lib/trading/portfolio';
import type { CreateCallInput } from '@/types/social';

/** Same limit the composer enforces client-side (`MAX_POST_LENGTH`). */
const MAX_BODY_LENGTH = 280;

/**
 * `POST /calls` — create a position-backed Callout. `positionId` is
 * **required**: there is only a Callout now, and it always attaches a
 * held position (docs/DECISIONS.md, "Callouts Require a Held
 * Position"). The client never sends an entry price/size/outcome/
 * snapshot — this backend resolves `positionId` (an outcome token id)
 * against the caller's live Polymarket portfolio and writes the
 * immutable snapshot itself (docs/API.md, "Client Never Sends a
 * Position Snapshot"). Every failure (unknown position, someone
 * else's position, missing market) is an honest rejection, never a
 * fabricated snapshot.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const body = (await request.json().catch(() => null)) as Partial<CreateCallInput> | null;
    if (
      !body ||
      typeof body.body !== 'string' ||
      body.body.trim().length === 0 ||
      body.body.length > MAX_BODY_LENGTH ||
      typeof body.positionId !== 'string' ||
      body.positionId.length === 0
    ) {
      throw badRequest(
        `Expected { body: string (1-${MAX_BODY_LENGTH} chars), positionId: string }. A Callout requires a held position.`
      );
    }

    const supabase = getSupabase();
    // Only positions the caller actually holds can back a Callout.
    const portfolio = await getUserPortfolio(viewer.id, privyUserId);
    const position = portfolio.find((candidate) => candidate.id === body.positionId);
    if (!position || !position.marketId) {
      throw notFound(`Position ${body.positionId} not found.`);
    }

    const marketSummary = await getAndCacheMarketSummary(position.marketId);
    if (!marketSummary) {
      throw notFound(`Market ${position.marketId} for this position no longer exists.`);
    }

    const { data: created, error } = await supabase
      .from('posts')
      .insert({
        author_id: viewer.id,
        body: body.body,
        market_id: position.marketId,
        position_snapshot_market_id: position.marketId,
        position_snapshot_outcome: position.outcome,
        position_snapshot_choice_index: position.choiceIndex,
        position_snapshot_entry_price: position.entryPrice,
        position_snapshot_size: position.size,
        position_snapshot_captured_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw error;

    const [feedItem] = await buildFeedItems([created as PostRow], viewer.id);
    return Response.json(feedItem, { status: 201 });
  });
}
