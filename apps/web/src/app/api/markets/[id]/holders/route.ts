import { notFound, withErrorHandling } from '@/lib/apiError';
import { fetchMarketById } from '@/lib/polymarket/gammaClient';
import { resolveMarketHolders } from '@/lib/marketHolders';
import type { MarketHolder } from '@/types/social';

const HOLDER_LIMIT = 20;

/** `GET /markets/:id/holders` — this market's top position holders,
 * proxied from Polymarket's own public holder data (`data-api
 * /holders`), the same source Polymarket's own page shows. Our `positions`
 * table is no longer used here: it only ever contains trades this app
 * executed, which made the list look permanently empty
 * (docs/DECISIONS.md, "Holders Come From Polymarket's Data API"). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      throw notFound(`Market ${id} not found.`);
    }

    const market = await fetchMarketById(id);
    if (!market) {
      throw notFound(`Market ${id} not found.`);
    }

    const holders = await resolveMarketHolders(market, HOLDER_LIMIT);

    const items: MarketHolder[] = holders.slice(0, HOLDER_LIMIT).map((holder) => ({
      id: holder.proxyWallet,
      displayName: holder.displayName,
      handle: holder.handle,
      avatarUrl: holder.avatarUrl,
      outcome: holder.outcome,
      shares: holder.shares,
    }));

    return Response.json(items);
  });
}
