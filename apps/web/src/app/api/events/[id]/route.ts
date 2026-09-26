import { notFound, withErrorHandling } from '@/lib/apiError';
import { fetchEventById } from '@/lib/polymarket/gammaClient';
import {
  categoryFromTags,
  childImageUrls,
  isDiscoverable,
  toMarketSummary,
} from '@/lib/polymarket/normalize';
import type { EventDetail } from '@/types/social';

/**
 * `GET /events/:id`  the grouped-event detail page ("Event Detail"),
 * built live from Polymarket's own event record: the event header plus
 * every discoverable child market, each an ordinary `MarketSummary`
 * carrying its own short `label` (`groupItemTitle`). Closed/archived
 * children are excluded exactly like every other list surface, so an
 * event that has nothing left still renders honestly (empty list)
 * never fabricated rows. Documented in docs/API.md.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;

    // Polymarket's own ids are always integer strings  a non-numeric id
    // can never exist there (same guard as `GET /markets/:id`).
    if (!/^\d+$/.test(id)) {
      throw notFound(`Event ${id} not found.`);
    }

    const event = await fetchEventById(id);
    if (!event) {
      throw notFound(`Event ${id} not found.`);
    }

    const category = categoryFromTags(event.tags);
    const markets = event.markets.filter(isDiscoverable);
    // Child images: keep the market's own API image unless it's the
    // event's own art (which the header already shows).
    const imageOverrides =
      markets.length > 1
        ? childImageUrls(markets, event.image ?? event.icon ?? null)
        : undefined;

    const detail: EventDetail = {
      id: event.id,
      title: event.title,
      category,
      imageUrl: event.image ?? event.icon ?? null,
      volume: event.volume,
      liquidity: event.liquidity,
      endDate: event.endDate,
      description: event.description ?? null,
      markets: markets.map((market) => toMarketSummary(market, category, event.liquidity, imageOverrides)),
    };

    return Response.json(detail);
  });
}
