import type { GammaEvent, GammaMarket, GammaTag } from '@/lib/polymarket/gammaTypes';
import type { Event as DomainEvent, Market as DomainMarket, Outcome } from '@/types/market';
import type {
  MarketDetail,
  MarketGroupSummary,
  MarketListItem,
  MarketOutcomeRow,
  MarketSummary,
} from '@/types/social';

/**
 * Categories follow the API's own data, never a hardcoded taxonomy.
 * Polymarket exposes no canonical "category" field on events (the
 * documented `category`/`categories` fields are absent from real
 * responses — verified live), only an ordered `tags` list, so:
 *
 * - When the request is filtered (`preferredSlug` = the `tag_slug` the
 *   backend queried with), that tag wins — every event returned under a
 *   category tab genuinely carries it, and this keeps the label
 *   consistent with the tab the user chose.
 * - Otherwise (Trending / search / single-market reads), the API's own
 *   first tag is used as-is.
 * - `'Other'` only when the event has no tags at all.
 */
export function categoryFromTags(tags: GammaTag[], preferredSlug?: string): string {
  if (tags.length === 0) return 'Other';
  const preferred = preferredSlug ? tags.find((tag) => tag.slug === preferredSlug) : undefined;
  return (preferred ?? tags[0]).label;
}

/**
 * Resolves which Polymarket CLOB token id a YES/NO trade should use —
 * `outcomes`/`clobTokenIds` are parallel JSON-encoded arrays (verified
 * live). Only meaningful for a binary (literal "Yes"/"No") market;
 * returns `null` for a non-binary market or an outcome that isn't
 * present, since a trading endpoint must never guess a token id.
 */
export function getOutcomeTokenId(market: GammaMarket, outcome: Outcome): string | null {
  const outcomes = parseJsonArray(market.outcomes);
  const tokenIds = parseJsonArray(market.clobTokenIds);
  const index = outcomes.findIndex((o) => o.toLowerCase() === outcome.toLowerCase());
  if (index === -1 || !tokenIds[index]) return null;
  return tokenIds[index];
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * `outcomes`/`outcomePrices` are JSON-encoded parallel string arrays,
 * prices in the 0-1 range. A market is treated as binary only when its
 * outcomes are literally "Yes"/"No" (case-insensitive) — anything else
 * (a 3+ outcome market, or two differently-labeled outcomes) is
 * surfaced as non-binary per docs/PRD.md ("never forced into a
 * fabricated YES/NO split"), with `yesPrice`/`noPrice` falling back to
 * the first two outcome prices so the card still has *something*
 * numeric to render, not because those necessarily mean "yes"/"no".
 */
function parseOutcomePrices(market: GammaMarket): {
  yesPrice: number;
  noPrice: number;
  isBinary: boolean;
  outcomeCount: number;
} {
  const outcomes = parseJsonArray(market.outcomes);
  const prices = parseJsonArray(market.outcomePrices).map((p) => Number(p));
  const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === 'yes');
  const noIndex = outcomes.findIndex((o) => o.toLowerCase() === 'no');
  const isBinary = outcomes.length === 2 && yesIndex !== -1 && noIndex !== -1;

  const toCents = (fraction: number | undefined) =>
    Number.isFinite(fraction) ? Math.round((fraction as number) * 100) : 0;

  return {
    yesPrice: isBinary ? toCents(prices[yesIndex]) : toCents(prices[0]),
    noPrice: isBinary ? toCents(prices[noIndex]) : toCents(prices[1]),
    isBinary,
    outcomeCount: outcomes.length,
  };
}

export function toMarketSummary(market: GammaMarket, category: string, eventLiquidity: number | null): MarketSummary {
  const { yesPrice, noPrice, isBinary, outcomeCount } = parseOutcomePrices(market);
  return {
    id: market.id,
    question: market.question,
    category,
    yesPrice,
    noPrice,
    volume: market.volumeNum ?? null,
    liquidity: market.liquidityNum ?? eventLiquidity ?? null,
    endDate: market.endDate,
    trending: market.featured,
    closed: market.closed,
    // Polymarket's `closed` means "trading stopped," not "settled" —
    // this backend doesn't yet have a reliable signal for the latter
    // (see docs/DATABASE.md's closed-vs-resolved distinction), so
    // `resolved` is left `undefined` rather than guessed from `closed`.
    isBinary,
    outcomeCount,
    imageUrl: market.image ?? market.icon ?? null,
  };
}

function toMarketOutcomeRow(market: GammaMarket): MarketOutcomeRow {
  const { yesPrice, noPrice } = parseOutcomePrices(market);
  return {
    id: market.id,
    label: market.groupItemTitle || market.question,
    yesPrice,
    noPrice,
    imageUrl: market.image ?? market.icon ?? null,
  };
}

function toMarketGroupSummary(event: GammaEvent, category: string): MarketGroupSummary {
  return {
    id: event.id,
    title: event.title,
    category,
    imageUrl: event.image ?? event.icon ?? null,
    volume: event.volume,
    liquidity: event.liquidity,
    endDate: event.endDate,
    trending: event.featured,
    closed: event.closed,
    outcomes: event.markets.map(toMarketOutcomeRow),
  };
}

/**
 * An event whose markets **all** carry a non-empty `groupItemTitle`
 * (verified live: e.g. "Donald Trump", "J.D. Vance" for "Republican
 * Presidential Nominee 2028") is a named-outcomes group — an election,
 * a threshold ladder, a matchup — and is emitted as one
 * `{ kind: 'group' }` row (`MarketGroupSummary`) rather than one row
 * per market. This matters beyond presentation: some of these events
 * have 100+ markets (verified live), so flattening them would make a
 * single Markets page almost entirely one election's candidates. An
 * event with a single market, or where `groupItemTitle` is empty for
 * any market, is emitted as ordinary flat `{ kind: 'market' }` row(s).
 */
export function toMarketListItems(event: GammaEvent, filterTagSlug?: string): MarketListItem[] {
  const category = categoryFromTags(event.tags, filterTagSlug);
  const isGroup = event.markets.length > 1 && event.markets.every((market) => market.groupItemTitle);

  if (isGroup) {
    return [{ kind: 'group', group: toMarketGroupSummary(event, category) }];
  }

  return event.markets.map((market) => ({
    kind: 'market' as const,
    market: toMarketSummary(market, category, event.liquidity),
  }));
}

export function toMarketDetail(
  market: GammaMarket,
  category: string,
  eventLiquidity: number | null
): MarketDetail {
  return {
    ...toMarketSummary(market, category, eventLiquidity),
    rules: market.description ?? null,
    openedAt: market.startDate ?? null,
    resolvedOutcome: null,
  };
}

/** `Event`/`Market` (types/market.ts) are the normalized DB-shaped
 * entities `GET /events` returns — distinct from `MarketSummary`
 * above, which is the denormalized feed/discovery shape. See
 * docs/DATABASE.md. */
export function toDomainEvent(event: GammaEvent): DomainEvent {
  const category = categoryFromTags(event.tags);
  return {
    id: event.id,
    title: event.title,
    category,
    markets: event.markets.map((market) => toDomainMarket(market, event.id, event.liquidity)),
  };
}

function toDomainMarket(market: GammaMarket, eventId: string, eventLiquidity: number | null): DomainMarket {
  const { yesPrice, noPrice } = parseOutcomePrices(market);
  return {
    id: market.id,
    eventId,
    question: market.question,
    yesPrice,
    noPrice,
    volume: market.volumeNum ?? 0,
    liquidity: market.liquidityNum ?? eventLiquidity ?? 0,
    endDate: market.endDate ?? '',
    resolved: false,
    resolvedOutcome: null satisfies Outcome | null,
  };
}
