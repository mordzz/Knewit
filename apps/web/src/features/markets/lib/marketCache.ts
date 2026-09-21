import { getSupabase } from '@/lib/supabase';
import { fetchEventForMarket, fetchMarketById } from '@/lib/polymarket/gammaClient';
import { categoryFromTags, toMarketSummary } from '@/lib/polymarket/normalize';
import type { MarketSummary } from '@/types/social';

/**
 * `posts.market_id` has a foreign key into our local `markets` table
 * (docs/DATABASE.md: "Market/Event rows are a cache of Polymarket
 * data"), but Phase 1 never wrote to it (pure live proxy, no caching
 * — see the web app README). Phase 2 needs the FK to actually
 * hold when a Call/Post references a market, so this fetches the
 * market live (reusing Phase 1's Gamma client/normalizer) and
 * upserts a minimal cache row before the reference is allowed.
 *
 * Returns the live `MarketSummary` (full display fidelity — imageUrl,
 * trending, etc., which the DB cache's minimal columns don't carry)
 * so callers expanding a `FeedItem.market` get the same shape
 * `GET /markets/:id` would return, not a stripped-down cached copy.
 * Returns `null` if Polymarket doesn't recognize the id.
 */
export async function getAndCacheMarketSummary(marketId: string): Promise<MarketSummary | null> {
  if (!/^\d+$/.test(marketId)) return null;

  const market = await fetchMarketById(marketId);
  if (!market) return null;

  const event = await fetchEventForMarket(marketId);
  const category = event ? categoryFromTags(event.tags) : 'Other';
  // A market is a "child" when its event has more than one market; only
  // then does a post attachment route to the parent event page.
  const isChild = event != null && event.markets.length > 1;
  const summary = toMarketSummary(
    market,
    category,
    event?.liquidity ?? null,
    undefined,
    isChild ? event!.id : null
  );

  if (event) {
    const supabase = getSupabase();
    const { error: eventError } = await supabase
      .from('events')
      .upsert({ id: event.id, title: event.title, category });
    if (eventError) throw eventError;

    const { error: marketError } = await supabase.from('markets').upsert({
      id: market.id,
      event_id: event.id,
      question: market.question,
      yes_price: summary.yesPrice,
      no_price: summary.noPrice,
      volume: summary.volume ?? 0,
      liquidity: summary.liquidity ?? 0,
      end_date: summary.endDate,
      resolved: false,
      resolved_outcome: null,
      choices: summary.choices,
      is_child: isChild,
    });
    if (marketError) throw marketError;
  }

  return summary;
}

/** Cheaper re-expansion for a `Post` whose market was already cached
 * by a prior `getAndCacheMarketSummary` call (e.g. when listing many
 * posts) — reads the local cache instead of hitting Polymarket again
 * per row. Falls back to a live fetch (and re-caching) on a cache
 * miss, since the cache has no TTL/backfill job yet. */
export async function getCachedOrLiveMarketSummary(marketId: string): Promise<MarketSummary | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('markets')
    .select(
      'id, event_id, question, yes_price, no_price, volume, liquidity, end_date, choices, is_child, events(category)'
    )
    .eq('id', marketId)
    .maybeSingle();

  // A row cached before the `choices` column existed has no choice list —
  // the UI renders choices, so fall back to a live fetch (and re-cache)
  // rather than serving a market with nothing to pick.
  const choices = Array.isArray(data?.choices) ? (data.choices as MarketSummary['choices']) : [];
  if (data && choices.length > 0) {
    const eventRow = data.events as unknown as { category: string } | { category: string }[] | null;
    const category = Array.isArray(eventRow) ? eventRow[0]?.category : eventRow?.category;
    return {
      id: data.id as string,
      question: data.question as string,
      category: category ?? 'Other',
      parentEventId: data.is_child ? ((data.event_id as string | null) ?? null) : null,
      yesPrice: data.yes_price as number,
      noPrice: data.no_price as number,
      volume: data.volume as number,
      liquidity: data.liquidity as number,
      endDate: data.end_date as string | null,
      choices,
    };
  }

  return getAndCacheMarketSummary(marketId);
}
