import { withErrorHandling } from '@/lib/apiError';
import { fetchEventsPage } from '@/lib/polymarket/gammaClient';
import { toMarketListItems } from '@/lib/polymarket/normalize';
import type { Paginated } from '@/types/common';
import type { MarketListItem } from '@/types/social';

/**
 * `GET /markets?cursor=&category=` — mirrors `marketService.getMarkets`
 * (mobile) exactly: cursor-based pagination, optional category filter.
 * Built on Polymarket's `/events` (not `/markets`) because only events
 * carry `tags` (category) — see `gammaClient.fetchEventsPage`. Each
 * event becomes one or more `MarketListItem`s — see
 * `normalize.ts::toMarketListItems` for the group-vs-flat decision.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const category = url.searchParams.get('category') ?? undefined;

    const { events, nextCursor } = await fetchEventsPage(
      cursor,
      category ? slugifyCategory(category) : undefined
    );

    const items: MarketListItem[] = events.flatMap(toMarketListItems);

    const page: Paginated<MarketListItem> = { items, nextCursor };
    return Response.json(page);
  });
}

/** Best-effort mapping from a human category label (e.g. "Pop Culture")
 * to Polymarket's tag slug convention (kebab-case) for the upstream
 * `tag_slug` filter — Polymarket's own labels/slugs already follow
 * this pattern (verified live), so no lookup table is needed. */
function slugifyCategory(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}
