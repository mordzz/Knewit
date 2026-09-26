import { notFound, withErrorHandling } from '@/lib/apiError';
import { fetchEventById } from '@/lib/polymarket/gammaClient';
import { resolveMarketHolders } from '@/features/markets/lib/marketHolders';
import type { EventHolderRow } from '@/types/social';

const HOLDER_LIMIT = 20;

/** `GET /events/:id/holders?market=<childId>`  the event's Top
 * Holders, proxied from Polymarket's public holder data (per market;
 * the Data API has no event-level holders endpoint). `?market=` picks a
 * child market; without it the child with the largest volume is used,
 * which is what the UI shows by default. Rows carry the child's own
 * short label so no second lookup is needed. */
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

    const requestedMarketId = new URL(request.url).searchParams.get('market');
    const market =
      (requestedMarketId
        ? event.markets.find((candidate) => candidate.id === requestedMarketId)
        : [...event.markets].sort((a, b) => (b.volumeNum ?? 0) - (a.volumeNum ?? 0))[0]) ?? null;

    if (requestedMarketId && !market) {
      throw notFound(`Market ${requestedMarketId} is not part of event ${id}.`);
    }
    if (!market) return Response.json([]);

    const marketLabel = market.groupItemTitle || market.question;
    const holders = await resolveMarketHolders(market, HOLDER_LIMIT);

    const items: EventHolderRow[] = holders.slice(0, HOLDER_LIMIT).map((holder) => ({
      id: `${holder.proxyWallet}:${market.id}`,
      user: {
        id: holder.proxyWallet,
        handle: holder.handle,
        displayName: holder.displayName,
        avatarUrl: holder.avatarUrl,
      },
      marketId: market.id,
      marketLabel,
      outcome: holder.outcome,
      shares: holder.shares,
    }));

    return Response.json(items);
  });
}
