import type { PriceRange } from '@/types/social';

const CLOB_BASE_URL = 'https://clob.polymarket.com';

export interface ClobPricePoint {
  t: number; // unix seconds
  p: number; // price, 0-1 (a probability fraction, not cents)
}

export interface ClobPriceHistoryResponse {
  history: ClobPricePoint[];
}

/**
 * `interval` is the lookback window (how far back the series goes),
 * `fidelity` is the candle resolution in minutes — verified against the
 * live `/prices-history` endpoint, not guessed. Chosen per `PriceRange`
 * so each range returns a reasonable point count (a few dozen), not a
 * single fetch-everything-at-1-minute-resolution call regardless of
 * range.
 */
const RANGE_TO_CLOB: Record<PriceRange, { interval: string; fidelity: number }> = {
  '1H': { interval: '1h', fidelity: 1 },
  '6H': { interval: '6h', fidelity: 5 },
  '1D': { interval: '1d', fidelity: 15 },
  '1W': { interval: '1w', fidelity: 60 },
  '1M': { interval: '1m', fidelity: 240 },
  ALL: { interval: 'max', fidelity: 1440 },
};

/**
 * A single outcome token's price history, straight from Polymarket's
 * CLOB — public, no auth (the spec lists `security: []` for this
 * endpoint). `market` here is a *CLOB token id* (one per outcome, from
 * a Gamma market's `clobTokenIds`), not the Gamma market id itself —
 * confirmed against the live API.
 */
export async function fetchClobPriceHistory(
  clobTokenId: string,
  range: PriceRange
): Promise<ClobPriceHistoryResponse> {
  const { interval, fidelity } = RANGE_TO_CLOB[range];
  const query = new URLSearchParams({ market: clobTokenId, interval, fidelity: String(fidelity) });
  const response = await fetch(`${CLOB_BASE_URL}/prices-history?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Polymarket CLOB prices-history failed: ${response.status}`);
  }
  return response.json() as Promise<ClobPriceHistoryResponse>;
}
