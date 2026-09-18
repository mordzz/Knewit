import type { GammaEvent, GammaMarket, GammaTag } from '@/lib/polymarket/gammaTypes';
import type { Event as DomainEvent, Market as DomainMarket, MarketChoice, Outcome } from '@/types/market';
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
 * Resolves which Polymarket CLOB token id a trade on `choiceIndex`
 * should use — `outcomes`/`clobTokenIds` are parallel JSON-encoded
 * arrays (verified live), so the index into `outcomes` (what the API
 * response's `MarketChoice.index` carries) is also the index into the
 * token list. Returns `null` for an out-of-range index, since a trading
 * endpoint must never guess a token id.
 */
export function getChoiceTokenId(market: GammaMarket, choiceIndex: number): string | null {
  const tokenIds = parseJsonArray(market.clobTokenIds);
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= tokenIds.length) {
    return null;
  }
  return tokenIds[choiceIndex] ?? null;
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
 * prices in the 0-1 range — this is the market's own list of tradeable
 * choices, in the API's order, and is rendered as-is (never forced into
 * a fabricated Yes/No pair). See `MarketChoice`.
 */
export function parseChoices(market: GammaMarket): MarketChoice[] {
  const outcomes = parseJsonArray(market.outcomes);
  const prices = parseJsonArray(market.outcomePrices).map((p) => Number(p));

  // Polymarket's tick sizes go down to 0.001/0.0001, so prices are kept
  // as decimal cents (up to 4 dp) — rounding to whole cents would turn a
  // real 0.1c price into 0 (docs/DECISIONS.md, "Sub-Cent Prices").
  const toCents = (fraction: number | undefined) =>
    Number.isFinite(fraction) ? Number(((fraction as number) * 100).toFixed(4)) : 0;

  return outcomes.map((label, index) => ({
    index,
    label,
    price: toCents(prices[index]),
  }));
}

/**
 * The legacy summary fields derived from `choices`: `isBinary` means the
 * two labels are literally "Yes"/"No" (the only case the app's
 * green/red pair maps to meaning), and `yesPrice`/`noPrice` then point
 * at whichever index each label has — for any other market they fall
 * back to the first two choices' prices so existing readers still get a
 * number.
 */
function summarizeChoices(choices: MarketChoice[]): {
  yesPrice: number;
  noPrice: number;
  isBinary: boolean;
  outcomeCount: number;
} {
  const yesIndex = choices.findIndex((c) => c.label.toLowerCase() === 'yes');
  const noIndex = choices.findIndex((c) => c.label.toLowerCase() === 'no');
  const isBinary = choices.length === 2 && yesIndex !== -1 && noIndex !== -1;

  return {
    yesPrice: isBinary ? choices[yesIndex].price : (choices[0]?.price ?? 0),
    noPrice: isBinary ? choices[noIndex].price : (choices[1]?.price ?? 0),
    isBinary,
    outcomeCount: choices.length,
  };
}

export function toMarketSummary(
  market: GammaMarket,
  category: string,
  eventLiquidity: number | null,
  /** Child-image override from `childImageUrls` — present only for
   * markets inside a multi-market event. */
  imageOverrides?: Map<string, string | null>,
  /** The parent event's id, passed only when that event has more than
   * one market (i.e. this market is a child). */
  parentEventId?: string | null
): MarketSummary {
  const choices = parseChoices(market);
  const { yesPrice, noPrice, isBinary, outcomeCount } = summarizeChoices(choices);
  return {
    id: market.id,
    question: market.question,
    // The short grouped-event label, when this market is one row of an
    // event — the event page/hero prefer it over the long `question`.
    label: market.groupItemTitle || null,
    parentEventId: parentEventId ?? null,
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
    imageUrl: imageOverrides ? (imageOverrides.get(market.id) ?? null) : (market.image ?? market.icon ?? null),
    choices,
  };
}

function toMarketOutcomeRow(
  market: GammaMarket,
  imageOverrides?: Map<string, string | null>
): MarketOutcomeRow {
  const choices = parseChoices(market);
  const { yesPrice, noPrice } = summarizeChoices(choices);
  return {
    id: market.id,
    label: market.groupItemTitle || market.question,
    yesPrice,
    noPrice,
    imageUrl: imageOverrides ? (imageOverrides.get(market.id) ?? null) : (market.image ?? market.icon ?? null),
    choices,
  };
}

function toMarketGroupSummary(
  event: GammaEvent,
  category: string,
  markets: GammaMarket[],
  imageOverrides?: Map<string, string | null>
): MarketGroupSummary {
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
    outcomes: markets.map((market) => toMarketOutcomeRow(market, imageOverrides)),
  };
}

/** Markets Polymarket no longer offers should not show up in discovery:
 * `closed` means trading stopped, `archived` means it was pulled from
 * Polymarket's own lists, and `active === false` marks the placeholder
 * child markets Polymarket never lists (verified live: 554 of 560
 * inactive children carry no price at all — the "Party B"/"Other" rows
 * in elections). Individual invalid child markets inside an otherwise-
 * open event are dropped here — the entry point for every list surface
 * (Markets tab, Search, Trending). Single-market reads
 * (`GET /markets/:id`) deliberately do NOT filter, so a link or an
 * older Callout can still open its detail page. */
export function isDiscoverable(market: GammaMarket): boolean {
  return !market.closed && !market.archived && market.active !== false;
}

/**
 * A child market keeps its own API image unless it is the **event's own
 * image** — that one merely repeats the card/header and says nothing
 * about the child, so it is dropped (`null`) and the row renders text
 * only. Sibling-shared art that differs from the event's (e.g. the
 * `Repetitive-markets/MLB.jpg` Polymarket gives every Spread/O-U row,
 * while the event itself uses the league icon) is kept: it is still the
 * image the API attaches to that market, verified live.
 */
export function childImageUrls(
  markets: GammaMarket[],
  eventImageUrl: string | null
): Map<string, string | null> {
  const overrides = new Map<string, string | null>();
  for (const market of markets) {
    const url = market.image ?? market.icon ?? null;
    overrides.set(market.id, url && url !== eventImageUrl ? url : null);
  }
  return overrides;
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
 * Closed/archived child markets are excluded first; if none remain, the
 * event contributes no row at all.
 */
export function toMarketListItems(event: GammaEvent, filterTagSlug?: string): MarketListItem[] {
  const markets = event.markets.filter(isDiscoverable);
  if (markets.length === 0) return [];

  const category = categoryFromTags(event.tags, filterTagSlug);
  // Any event with more than one discoverable market is one group card —
  // a child market must never surface as a standalone card, including
  // the mixed events where the moneyline row lacks a `groupItemTitle`
  // (verified live: "Lions vs. Bills" has 315 such children).
  const isGroup = markets.length > 1;
  // Child images: keep the market's own API image unless it's the
  // event's own art (which is already on the card header).
  const isChildEvent = event.markets.length > 1;
  const imageOverrides =
    markets.length > 1
      ? childImageUrls(markets, event.image ?? event.icon ?? null)
      : undefined;
  const parentEventId = isChildEvent ? event.id : null;

  if (isGroup) {
    return [{ kind: 'group', group: toMarketGroupSummary(event, category, markets, imageOverrides) }];
  }

  return markets.map((market) => ({
    kind: 'market' as const,
    market: toMarketSummary(market, category, event.liquidity, imageOverrides, parentEventId),
  }));
}

export function toMarketDetail(
  market: GammaMarket,
  category: string,
  eventLiquidity: number | null,
  parentEventId?: string | null
): MarketDetail {
  return {
    ...toMarketSummary(market, category, eventLiquidity, undefined, parentEventId),
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
    markets: event.markets
      .filter(isDiscoverable)
      .map((market) => toDomainMarket(market, event.id, event.liquidity)),
  };
}

function toDomainMarket(market: GammaMarket, eventId: string, eventLiquidity: number | null): DomainMarket {
  const { yesPrice, noPrice } = summarizeChoices(parseChoices(market));
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
