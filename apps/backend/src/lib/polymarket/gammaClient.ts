import { env } from '@/lib/env';
import { upstreamError } from '@/lib/apiError';
import type { GammaEvent, GammaMarket, GammaTag } from '@/lib/polymarket/gammaTypes';

async function gammaGet<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${env.polymarketGammaBaseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw upstreamError('Unable to reach Polymarket.');
  }

  if (!response.ok) {
    throw upstreamError(`Polymarket request failed (${response.status}).`);
  }

  return (await response.json()) as T;
}

const PAGE_SIZE = 20;

/** Backs `GET /markets` and `GET /events` — Polymarket's own `/events`
 * groups related markets and carries the `tags` this backend uses for
 * category, which the plain `/markets` endpoint's nested `events` field
 * doesn't (verified live — see the Phase 1 design notes). `cursor` is
 * an opaque numeric offset. */
export async function fetchEventsPage(cursor: string | undefined, categoryTagSlug?: string): Promise<{
  events: GammaEvent[];
  nextCursor: string | null;
}> {
  const offset = cursor ? Number(cursor) : 0;
  const events = await gammaGet<GammaEvent[]>('/events', {
    limit: PAGE_SIZE,
    offset,
    active: true,
    closed: false,
    order: 'volume24hr',
    ascending: false,
    tag_slug: categoryTagSlug,
  });
  const nextCursor = events.length === PAGE_SIZE ? String(offset + PAGE_SIZE) : null;
  return { events, nextCursor };
}

/** Single-market fetch (`GET /markets/:id`) has no `events`/`tags`
 * field on Polymarket's side, so category is resolved via a second
 * call — `fetchEventForMarket` — rather than guessed. */
export async function fetchMarketById(id: string): Promise<GammaMarket | null> {
  const markets = await gammaGet<GammaMarket[]>('/markets', { id });
  return markets[0] ?? null;
}

/** Polymarket's single-event fetch (unlike the bulk `/events` list)
 * reliably includes `tags` — used to resolve a market's category for
 * `GET /markets/:id`. Returns `null` if the market has no discoverable
 * parent event (Gamma's `/markets?id=` list response nests one). */
export async function fetchEventForMarket(marketId: string): Promise<GammaEvent | null> {
  const markets = await gammaGet<Array<GammaMarket & { events?: Array<{ id: string }> }>>('/markets', {
    id: marketId,
  });
  const eventId = markets[0]?.events?.[0]?.id;
  if (!eventId) return null;
  return gammaGet<GammaEvent>(`/events/${eventId}`, {});
}

/**
 * Polymarket's `/tags` list has no "this is a top-level category" flag
 * (`forceShow` is `false` even on foundational tags like "Politics"/
 * "Sports" — verified live) and isn't ordered by relevance, so paging
 * through it produces a noisy mix of thousands of narrow tags (a single
 * athlete's name, a one-off show). There's also no dedicated "give me
 * the site's nav categories" endpoint. So this resolves a candidate
 * slug list against Polymarket's `/tags/slug/:slug`, live, one call per
 * candidate — same mechanism as before, but the candidates themselves
 * are no longer this app's own opinion. They were derived from
 * Polymarket's own live behavior, not decided here: cross-referenced
 * against the real category links Polymarket's own site currently
 * serves in its markets navigation, then corroborated by aggregating
 * the tags actually attached to ~1500 of Polymarket's own current
 * highest-volume active events (each of these appeared on 80-500+ of
 * them — Sports, Politics, and Elections alone cover the majority),
 * which is a materially different (and larger) set than this app's old
 * candidate list, which just mirrored the mobile app's own hardcoded
 * `KNOWN_CATEGORIES` dressed up as "verified." A candidate that 404s
 * (doesn't exist on Polymarket right now, or gets renamed later) is
 * silently dropped rather than fabricated — this list is a starting
 * point for the live lookup below, not itself the source of truth.
 */
const CATEGORY_SLUG_CANDIDATES = [
  'politics',
  'sports',
  'elections',
  'crypto',
  'geopolitics',
  'finance',
  'economy',
  'tech',
  'world',
  'pop-culture',
  'esports',
  'weather',
  'ai',
];

export async function fetchCategoryTags(): Promise<GammaTag[]> {
  const results = await Promise.all(
    CATEGORY_SLUG_CANDIDATES.map(async (slug) => {
      try {
        return await gammaGet<GammaTag>(`/tags/slug/${slug}`, {});
      } catch {
        return null;
      }
    })
  );
  return results.filter((tag): tag is GammaTag => tag !== null);
}

/** Backs the markets half of `GET /search` — Polymarket's dedicated
 * `/public-search` endpoint (verified live), unlike `/events`'s own
 * `title=` filter param which silently does nothing (also verified
 * live). Response events carry `tags`/`markets` in the same shape as
 * `/events`, so `toMarketListItems` works unchanged. */
export async function searchEvents(query: string, limitPerType = 10): Promise<GammaEvent[]> {
  const response = await gammaGet<{ events: GammaEvent[] }>('/public-search', {
    q: query,
    limit_per_type: limitPerType,
    events_status: 'active',
  });
  return response.events ?? [];
}
