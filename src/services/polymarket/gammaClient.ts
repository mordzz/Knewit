/**
 * Direct client for Polymarket's public Gamma API — markets, events,
 * tags, search. Deliberately separate from `services/api/client.ts`'s
 * `apiRequest` (which targets *our own* backend with a Privy bearer
 * token): this hits a third-party host with no auth at all, which
 * `apiRequest` isn't built for and shouldn't be repurposed to do. See
 * docs/DECISIONS.md ("Direct Polymarket Integration for Market Data")
 * for why this app now calls Polymarket directly for read-only market
 * data, superseding the earlier "never call Polymarket directly, only
 * through our backend" decision (docs/ARCHITECTURE.md) — that decision
 * remains true for anything requiring credentials or order-signing
 * (trading), which this client never touches.
 */

const GAMMA_BASE_URL = 'https://gamma-api.polymarket.com';

type QueryValue = string | number | boolean | undefined;

async function gammaRequest<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) query.set(key, String(value));
    }
  }
  const qs = query.toString();
  const response = await fetch(`${GAMMA_BASE_URL}${path}${qs ? `?${qs}` : ''}`);
  if (!response.ok) {
    throw new Error(`Polymarket Gamma API ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Only the fields this app actually reads — Gamma's real market object
 * has many more (fees, UMA bond/reward, sports metadata, etc.) that
 * nothing here needs. Field names/shapes verified against the live API
 * response, not guessed — `outcomes`/`outcomePrices`/`clobTokenIds` are
 * genuinely JSON-encoded *strings*, not arrays, on the wire. */
export interface GammaMarket {
  id: string;
  question?: string | null;
  groupItemTitle?: string | null;
  outcomes?: string | null;
  outcomePrices?: string | null;
  volume?: string | null;
  volumeNum?: number | null;
  liquidity?: string | null;
  liquidityNum?: number | null;
  endDate?: string | null;
  endDateIso?: string | null;
  startDate?: string | null;
  startDateIso?: string | null;
  image?: string | null;
  icon?: string | null;
  clobTokenIds?: string | null;
  closed?: boolean | null;
  active?: boolean | null;
  description?: string | null;
  conditionId?: string;
  /** Only present when fetched with `?include_tag=true` (see
   * `fetchGammaMarketById`) — a market's list-fetch shape never
   * includes this. */
  tags?: GammaTag[];
}

export interface GammaEvent {
  id: string;
  title: string;
  image?: string | null;
  icon?: string | null;
  volume?: number | null;
  liquidity?: number | null;
  endDate?: string | null;
  closed?: boolean | null;
  markets?: GammaMarket[];
}

export interface GammaTag {
  id: string;
  label: string;
  slug: string;
}

interface ListParams {
  limit: number;
  offset: number;
  tagId?: string;
  order?: string;
  ascending?: boolean;
  closed?: boolean;
}

/** A page of events — each event is either a single market (`markets.length
 * === 1`) or a combo/group (`markets.length > 1`, e.g. an election with
 * several candidates). Fetching events rather than raw markets is what
 * makes combo grouping possible at all — Polymarket's own data model
 * groups related markets under an event, this app's `MarketGroupSummary`
 * concept maps directly onto that. */
export function fetchGammaEvents(params: ListParams): Promise<GammaEvent[]> {
  return gammaRequest<GammaEvent[]>('/events', {
    limit: params.limit,
    offset: params.offset,
    tag_id: params.tagId,
    order: params.order,
    ascending: params.ascending,
    closed: params.closed,
  });
}

/** `include_tag=true` is what makes `GammaMarket.tags` present — needed
 * when the caller doesn't already know the market's category (Market
 * Detail opened directly, not from a category-filtered list) — see
 * `categories.ts`'s `deriveCategoryFromTags`. */
export function fetchGammaMarketById(id: string): Promise<GammaMarket> {
  return gammaRequest<GammaMarket>(`/markets/${id}`, { include_tag: true });
}

export function fetchGammaEventById(id: string): Promise<GammaEvent> {
  return gammaRequest<GammaEvent>(`/events/${id}`);
}

const tagCache = new Map<string, GammaTag | null>();

/** Resolves a category name (e.g. "Pop Culture") to Polymarket's own
 * tag id, via its clean slug lookup (`/tags/slug/{slug}`) — verified
 * against the live API for every category this app has
 * (`categories.ts` holds the slug map). Cached in-memory: tag ids don't
 * change during a session, and this is called once per category the
 * user actually visits, not on every market fetch. */
export async function fetchTagBySlug(slug: string): Promise<GammaTag | null> {
  if (tagCache.has(slug)) return tagCache.get(slug) ?? null;
  try {
    const tag = await gammaRequest<GammaTag>(`/tags/slug/${slug}`);
    tagCache.set(slug, tag);
    return tag;
  } catch {
    tagCache.set(slug, null);
    return null;
  }
}

export interface GammaSearchResponse {
  events?: GammaEvent[];
}

/** Polymarket's own fuzzy search — used for this app's Search screen's
 * Markets section only; People search stays this app's own backend
 * (Polymarket has no concept of this app's users) — see
 * docs/DECISIONS.md. */
export function searchGamma(query: string): Promise<GammaSearchResponse> {
  return gammaRequest<GammaSearchResponse>('/public-search', { q: query, limit_per_type: 8 });
}
