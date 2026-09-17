import { notFound, upstreamError, withErrorHandling } from '@/lib/apiError';
import { fetchMarketById } from '@/lib/polymarket/gammaClient';
import { fetchPriceHistory, type ClobInterval } from '@/lib/polymarket/clobClient';
import { getOutcomeTokenId } from '@/lib/polymarket/normalize';
import type { PricePoint, PriceRange } from '@/types/social';

const RANGE_TO_INTERVAL: Record<PriceRange, ClobInterval> = {
  '1H': '1h',
  '6H': '6h',
  '1D': '1d',
  '1W': '1w',
  '1M': '1m',
  ALL: 'max',
};

function parseRange(raw: string | null): PriceRange {
  const candidate = (raw ?? '1D').toUpperCase();
  return (Object.keys(RANGE_TO_INTERVAL) as PriceRange[]).includes(candidate as PriceRange)
    ? (candidate as PriceRange)
    : '1D';
}

/** `GET /markets/:id/price-history?range=` — a binary market's real YES-price
 * history, proxied from Polymarket's CLOB API (`clobClient.ts`), the
 * only place Polymarket publishes this. `PricePoint.price` is the same
 * cents unit `MarketSummary.yesPrice` uses, derived from the CLOB's own
 * `p` (0-1 decimal), so the chart's most recent point always agrees
 * with whatever live price the rest of Market Detail shows. A
 * non-binary market (no resolvable YES token) gets a clean 404 — this
 * endpoint has no honest series to return for one, and never fabricates
 * one. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const range = parseRange(url.searchParams.get('range'));

    if (!/^\d+$/.test(id)) {
      throw notFound(`Market ${id} not found.`);
    }

    const market = await fetchMarketById(id);
    if (!market) {
      throw notFound(`Market ${id} not found.`);
    }

    const yesTokenId = getOutcomeTokenId(market, 'YES');
    if (!yesTokenId) {
      throw notFound(`Market ${id} has no binary price history.`);
    }

    const history = await fetchPriceHistory(yesTokenId, RANGE_TO_INTERVAL[range]);
    if (history.length === 0) {
      throw upstreamError(`Polymarket returned no price history for market ${id}.`);
    }

    const points: PricePoint[] = history.map((point) => ({
      timestamp: new Date(point.t * 1000).toISOString(),
      price: Math.round(point.p * 100),
    }));
    return Response.json(points);
  });
}
