import type { GammaEvent, GammaMarket } from '@/services/polymarket/gammaClient';
import type { ClobPriceHistoryResponse } from '@/services/polymarket/clobClient';
import type { DataApiHoldersEntry } from '@/services/polymarket/dataApiClient';
import type {
  MarketDetail,
  MarketGroupSummary,
  MarketHolder,
  MarketOutcomeRow,
  MarketSummary,
  PricePoint,
} from '@/types/social';

/** `outcomes`/`outcomePrices`/`clobTokenIds` are JSON-encoded *strings*
 * on Polymarket's wire format, not arrays — confirmed against the live
 * API. Malformed/missing input degrades to an empty array rather than
 * throwing, since a single bad field on one market shouldn't fail an
 * entire list fetch. */
function parseJsonStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function priceFractionToCents(value: string | undefined): number {
  const fraction = Number(value ?? '0');
  return Math.round((Number.isFinite(fraction) ? fraction : 0) * 100);
}

export function getClobTokenIds(market: GammaMarket): string[] {
  return parseJsonStringArray(market.clobTokenIds);
}

/**
 * A Gamma market → this app's `MarketSummary`. `category` is passed in
 * by the caller rather than derived from the raw market — Polymarket's
 * market object carries no `category` field at all (confirmed against
 * the live API); the caller already knows which category tab/tag it
 * fetched under, so there's nothing to derive here that isn't already
 * known.
 */
export function gammaMarketToSummary(raw: GammaMarket, category: string): MarketSummary {
  const outcomes = parseJsonStringArray(raw.outcomes);
  const prices = parseJsonStringArray(raw.outcomePrices);
  const isBinary = outcomes.length === 2;
  const yesPrice = priceFractionToCents(prices[0]);
  const noPrice = isBinary ? priceFractionToCents(prices[1]) : 100 - yesPrice;
  const isLiteralYesNo =
    outcomes[0]?.toLowerCase() === 'yes' && outcomes[1]?.toLowerCase() === 'no';

  return {
    id: raw.id,
    question: raw.question ?? raw.groupItemTitle ?? 'Untitled market',
    category,
    yesPrice,
    noPrice,
    volume: raw.volumeNum ?? (raw.volume ? Number(raw.volume) : null),
    liquidity: raw.liquidityNum ?? (raw.liquidity ? Number(raw.liquidity) : null),
    endDate: raw.endDateIso ?? raw.endDate ?? null,
    closed: raw.closed ?? false,
    // Polymarket's market object has no separate "resolved" flag — a
    // closed market with a price pinned to 0 or 1 is the honest signal
    // an outcome actually settled, distinct from merely "trading closed".
    resolved: raw.closed === true && (yesPrice === 0 || yesPrice === 100),
    isBinary,
    outcomeCount: outcomes.length || null,
    imageUrl: raw.image ?? raw.icon ?? null,
    outcomeLabels: isBinary && !isLiteralYesNo ? { yes: outcomes[0], no: outcomes[1] } : undefined,
  };
}

export function gammaMarketToDetail(raw: GammaMarket, category: string): MarketDetail {
  const summary = gammaMarketToSummary(raw, category);
  return {
    ...summary,
    rules: raw.description ?? null,
    openedAt: raw.startDateIso ?? raw.startDate ?? null,
    resolvedOutcome: summary.resolved ? (summary.yesPrice >= 50 ? 'YES' : 'NO') : null,
  };
}

/**
 * A Gamma event → this app's `MarketGroupSummary` — only when the event
 * genuinely wraps more than one market (a combo, e.g. an election's
 * several candidates). A single-market event isn't a "combo" at all —
 * see `gammaEventToListItem` below, which is what actually decides
 * between the two shapes.
 */
export function gammaEventToGroup(raw: GammaEvent, category: string): MarketGroupSummary {
  const markets = raw.markets ?? [];
  const outcomes: MarketOutcomeRow[] = markets
    .map((market): MarketOutcomeRow => {
      const prices = parseJsonStringArray(market.outcomePrices);
      return {
        id: market.id,
        label: market.groupItemTitle || market.question || raw.title,
        yesPrice: priceFractionToCents(prices[0]),
        noPrice: priceFractionToCents(prices[1]),
        imageUrl: market.image ?? market.icon ?? null,
      };
    })
    .sort((a, b) => b.yesPrice - a.yesPrice);

  return {
    id: raw.id,
    title: raw.title,
    category,
    imageUrl: raw.image ?? raw.icon ?? null,
    volume: raw.volume ?? null,
    liquidity: raw.liquidity ?? null,
    endDate: raw.endDate ?? null,
    closed: raw.closed ?? false,
    resolved: raw.closed ?? false,
    outcomes,
  };
}

export type GammaListItem =
  { kind: 'market'; market: MarketSummary } | { kind: 'group'; group: MarketGroupSummary };

/** The one place that decides "is this event a single market or a
 * combo" — by the actual number of markets it wraps, never by category
 * or any other heuristic. */
export function gammaEventToListItem(raw: GammaEvent, category: string): GammaListItem | null {
  const markets = raw.markets ?? [];
  if (markets.length === 0) return null;
  if (markets.length === 1) {
    return { kind: 'market', market: gammaMarketToSummary(markets[0], category) };
  }
  return { kind: 'group', group: gammaEventToGroup(raw, category) };
}

export function clobHistoryToPricePoints(raw: ClobPriceHistoryResponse): PricePoint[] {
  return raw.history.map((point) => ({
    timestamp: new Date(point.t * 1000).toISOString(),
    price: Math.round(point.p * 100),
  }));
}

/**
 * Flattens every outcome token's holder list into one ranked list —
 * `outcomeIndex` (0/1 on the wire) maps to YES/NO in the same order as
 * a binary market's own `outcomes` array (index 0 is always the market's
 * first/YES outcome on Polymarket). Capped at 20: a market can genuinely
 * have thousands of holders, and this app's Top Holders tab is a
 * highlight list, not a full ledger.
 */
export function dataApiHoldersToMarketHolders(entries: DataApiHoldersEntry[]): MarketHolder[] {
  const all: MarketHolder[] = entries.flatMap((entry) =>
    entry.holders.map((holder) => ({
      id: `${holder.proxyWallet}-${entry.token}`,
      displayName: holder.name || holder.pseudonym || 'Anonymous',
      handle: holder.pseudonym || holder.proxyWallet.slice(0, 10),
      avatarUrl: holder.profileImage || null,
      outcome: holder.outcomeIndex === 0 ? 'YES' : 'NO',
      shares: holder.amount,
    }))
  );

  return all.sort((a, b) => b.shares - a.shares).slice(0, 20);
}
