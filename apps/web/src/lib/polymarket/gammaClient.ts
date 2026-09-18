import { env } from "@/lib/env";
import { upstreamError } from "@/lib/apiError";
import type { GammaEvent, GammaMarket, GammaTag } from "@/lib/polymarket/gammaTypes";

async function gammaGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${env.polymarketGammaBaseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw upstreamError("Unable to reach Polymarket.");
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
export async function fetchEventsPage(
  cursor: string | undefined,
  categoryTagSlug?: string,
): Promise<{
  events: GammaEvent[];
  nextCursor: string | null;
}> {
  const offset = cursor ? Number(cursor) : 0;
  const page = await gammaGet<GammaEvent[]>("/events", {
    limit: PAGE_SIZE,
    offset,
    active: true,
    closed: false,
    order: "volume24hr",
    ascending: false,
    tag_slug: categoryTagSlug,
  });
  // The cursor advances by the raw page size — the sub-event filter must
  // not stop pagination early. Verified live: `public-search` also
  // excludes these "- More Markets" extras, so a list should never show
  // them (GET /events/:id still serves them for a direct link).
  const nextCursor = page.length === PAGE_SIZE ? String(offset + PAGE_SIZE) : null;
  const events = page.filter((event) => !event.parentEventId);
  return { events, nextCursor };
}

/** Single-market fetch (`GET /markets/:id`) has no `events`/`tags`
 * field on Polymarket's side, so category is resolved via a second
 * call — `fetchEventForMarket` — rather than guessed. */
export async function fetchMarketById(id: string): Promise<GammaMarket | null> {
  const markets = await gammaGet<GammaMarket[]>("/markets", { id });
  return markets[0] ?? null;
}

/** Polymarket's single-event fetch (unlike the bulk `/events` list)
 * reliably includes `tags` — used to resolve a market's category for
 * `GET /markets/:id`. Returns `null` if the market has no discoverable
 * parent event (Gamma's `/markets?id=` list response nests one). */
export async function fetchEventForMarket(marketId: string): Promise<GammaEvent | null> {
  const markets = await gammaGet<Array<GammaMarket & { events?: Array<{ id: string }> }>>(
    "/markets",
    {
      id: marketId,
    },
  );
  const eventId = markets[0]?.events?.[0]?.id;
  if (!eventId) return null;
  return gammaGet<GammaEvent>(`/events/${eventId}`, {});
}

/** Single event by id — backs `GET /events/:id` (the group/event detail
 * page). Uses the list endpoint's `id` filter (verified live) rather
 * than `/events/{id}`, so an unknown id comes back as an empty list
 * (`null` here) and a real upstream failure still propagates as an
 * upstream error, mirroring `fetchMarketById`. */
export async function fetchEventById(eventId: string): Promise<GammaEvent | null> {
  const events = await gammaGet<GammaEvent[]>("/events", { id: eventId });
  return events[0] ?? null;
}

/**
 * The category tabs' slugs are Polymarket's **own markets-navigation
 * slugs**, verified live from polymarket.com's rendered nav (2026-09-17,
 * e.g. `href="/pop-culture"` → label "Culture"): the site links by slug,
 * and each slug's label comes from the tag API itself. There is no
 * "give me the nav categories" endpoint — `/tags` is an unordered dump
 * of thousands of narrow tags (no category flag: `forceShow` is `false`
 * even on foundational tags, and is `true` for non-categories like
 * "Bitcoin"/"Featured"), and `/categories` does not exist (404). So the
 * only API-faithful approach is: keep the nav's slug list, resolve each
 * one live via `/tags/slug/:slug`, and take `{label, slug}` from the
 * response — never reconstruct a slug from a label.
 *
 * `mentions` is deliberately absent: it's a Polymarket site page, not a
 * tag (404s upstream — verified live). Slugs not in the current nav
 * (`world`, `ai`) are not tabs here even though they're valid tags.
 * A candidate that 404s (renamed/removed upstream) is silently dropped
 * rather than fabricated — this list is a starting point for the live
 * lookup below, not itself the source of truth.
 */
const CATEGORY_SLUG_CANDIDATES = [
  "politics",
  "sports",
  "crypto",
  "esports",
  "iran",
  "finance",
  "geopolitics",
  "tech",
  "pop-culture",
  "economy",
  "weather",
  "elections",
];

export async function fetchCategoryTags(): Promise<GammaTag[]> {
  const results = await Promise.all(
    CATEGORY_SLUG_CANDIDATES.map(async (slug) => {
      try {
        return await gammaGet<GammaTag>(`/tags/slug/${slug}`, {});
      } catch {
        return null;
      }
    }),
  );
  return results.filter((tag): tag is GammaTag => tag !== null);
}

/** Backs the markets half of `GET /search` — Polymarket's dedicated
 * `/public-search` endpoint (verified live), unlike `/events`'s own
 * `title=` filter param which silently does nothing (also verified
 * live). Response events carry `tags`/`markets` in the same shape as
 * `/events`, so `toMarketListItems` works unchanged. */
export async function searchEvents(query: string, limitPerType = 10): Promise<GammaEvent[]> {
  const response = await gammaGet<{ events: GammaEvent[] }>("/public-search", {
    q: query,
    limit_per_type: limitPerType,
    events_status: "active",
  });
  return response.events ?? [];
}
