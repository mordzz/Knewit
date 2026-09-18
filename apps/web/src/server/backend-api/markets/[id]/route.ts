import { notFound, upstreamError, withErrorHandling } from "@/lib/apiError";
import { fetchEventForMarket, fetchMarketById } from "@/lib/polymarket/gammaClient";
import { categoryFromTags, toMarketDetail } from "@/lib/polymarket/normalize";

/** `GET /markets/:id` — mirrors `marketService.getMarketById` (mobile).
 * A market-id lookup has no `tags` on Polymarket's side, so category
 * comes from a second lookup of its parent event (see
 * `gammaClient.fetchEventForMarket`). Returns 404 for an id Polymarket
 * doesn't recognize, per docs/API.md. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;

    // Polymarket's own ids are always integer strings — a non-numeric
    // id can never exist there, and sending one upstream gets a 422
    // ("invalid integer") that would otherwise surface as a misleading
    // 502. Short-circuit to a clean 404 instead (verified live).
    if (!/^\d+$/.test(id)) {
      throw notFound(`Market ${id} not found.`);
    }

    const market = await fetchMarketById(id);
    if (!market) {
      throw notFound(`Market ${id} not found.`);
    }

    const event = await fetchEventForMarket(id);
    if (!event) {
      // A market with no discoverable parent event is unusual — surface
      // as an upstream inconsistency rather than fabricating a category.
      throw upstreamError(`Market ${id} has no associated Polymarket event.`);
    }

    const category = categoryFromTags(event.tags);
    return Response.json(
      toMarketDetail(market, category, event.liquidity, event.markets.length > 1 ? event.id : null),
    );
  });
}
