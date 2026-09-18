import { badRequest, notFound, upstreamError, withErrorHandling } from '@/lib/apiError';
import { fetchMarketById } from '@/lib/polymarket/gammaClient';
import { fetchPriceHistory, type ClobInterval } from '@/lib/polymarket/clobClient';
import { getChoiceTokenId, parseChoices } from '@/lib/polymarket/normalize';
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

/** `GET /markets/:id/price-history?range=&choice=` — the real price
 * history of one of the market's choices (default: the first one), in
 * the market's own `outcomes` order, so a chart follows whichever
 * choice the user selected. Proxied from Polymarket's CLOB API
 * (`clobClient.ts`), the only place Polymarket publishes this.
 * `PricePoint.price` is the same cents unit `MarketChoice.price` uses,
 * derived from the CLOB's own `p` (0-1 decimal), so the chart's most
 * recent point always agrees with whatever live price the rest of
 * Market Detail shows. An out-of-range choice (or a market with no
 * resolvable token) gets a clean 404 — this endpoint has no honest
 * series to return, and never fabricates one. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const range = parseRange(url.searchParams.get('range'));
    const rawChoice = url.searchParams.get('choice');
    const choiceIndex = rawChoice === null ? 0 : Number(rawChoice);

    if (!/^\d+$/.test(id)) {
      throw notFound(`Market ${id} not found.`);
    }
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0) {
      throw badRequest('Expected ?choice=<index> to be a non-negative integer.');
    }

    const market = await fetchMarketById(id);
    if (!market) {
      throw notFound(`Market ${id} not found.`);
    }

    const choice = parseChoices(market)[choiceIndex];
    if (!choice) {
      throw notFound(`Market ${id} has no choice at index ${choiceIndex}.`);
    }

    const tokenId = getChoiceTokenId(market, choiceIndex);
    if (!tokenId) {
      throw notFound(`Market ${id} has no price history for choice "${choice.label}".`);
    }

    const history = await fetchPriceHistory(tokenId, RANGE_TO_INTERVAL[range]);
    if (history.length === 0) {
      throw upstreamError(`Polymarket returned no price history for market ${id}.`);
    }

    const points: PricePoint[] = history.map((point) => ({
      timestamp: new Date(point.t * 1000).toISOString(),
      // Decimal cents (up to 4 dp) — same unit as `MarketChoice.price`;
      // rounding to whole cents flattens sub-cent markets to 0.
      price: Number((point.p * 100).toFixed(4)),
    }));
    return Response.json(points);
  });
}
