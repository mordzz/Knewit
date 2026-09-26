import { withErrorHandling } from '@/lib/apiError';
import { fetchEventsPage } from '@/lib/polymarket/gammaClient';
import { toMarketListItems } from '@/lib/polymarket/normalize';
import type { Paginated } from '@/types/common';
import type { MarketListItem } from '@/types/social';

/**
 * `GET /markets?cursor=&category=`  mirrors `marketService.getMarkets`
 * (mobile) exactly: cursor-based pagination, optional category filter.
 * `category` is Polymarket's own tag **slug** (as returned by
 * `GET /categories`)  passed straight through to the upstream
 * `tag_slug` filter, never derived from a display label (the label and
 * slug are different namespaces upstream: `pop-culture` ↔ "Culture").
 * Built on Polymarket's `/events` (not `/markets`) because only events
 * carry `tags`  see `gammaClient.fetchEventsPage`. Each event becomes
 * one or more `MarketListItem`s  see
 * `normalize.ts::toMarketListItems` for the group-vs-flat decision and
 * the category-label rule.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const category = url.searchParams.get('category') ?? undefined;

    const { events, nextCursor } = await fetchEventsPage(cursor, category);

    const items: MarketListItem[] = events.flatMap((event) => toMarketListItems(event, category));

    const page: Paginated<MarketListItem> = { items, nextCursor };
    return Response.json(page);
  });
}
