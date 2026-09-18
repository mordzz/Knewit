import { env } from "@/lib/env";
import { upstreamError } from "@/lib/apiError";

/** Polymarket's CLOB API — a separate service from Gamma
 * (`gammaClient.ts`) and Data (`dataApiClient.ts`), the only place
 * Polymarket publishes a token's price history. Verified live:
 * `GET /prices-history?market=<clobTokenId>&interval=<interval>&fidelity=<minutes>`
 * returns `{ history: [{ t: unixSeconds, p: price 0-1 }] }`. Public,
 * no key — same convention the Gamma/Data clients already follow. */

export interface ClobPricePoint {
  t: number;
  p: number;
}

export type ClobInterval = "1h" | "6h" | "1d" | "1w" | "1m" | "max";

/** Minutes-per-candle for each interval — small enough for a readable
 * chart, large enough to stay well under Polymarket's own documented
 * minimum `fidelity` per range (verified live: `1w` rejects anything
 * below 5, `1m` rejects anything below 10). */
const FIDELITY_MINUTES: Record<ClobInterval, number> = {
  "1h": 1,
  "6h": 5,
  "1d": 15,
  "1w": 60,
  "1m": 240,
  max: 1440,
};

export async function fetchPriceHistory(
  clobTokenId: string,
  interval: ClobInterval,
): Promise<ClobPricePoint[]> {
  const url = new URL("/prices-history", env.polymarketClobBaseUrl);
  url.searchParams.set("market", clobTokenId);
  url.searchParams.set("interval", interval);
  url.searchParams.set("fidelity", String(FIDELITY_MINUTES[interval]));

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw upstreamError("Unable to reach Polymarket.");
  }

  if (!response.ok) {
    throw upstreamError(`Polymarket request failed (${response.status}).`);
  }

  const body = (await response.json()) as { history?: ClobPricePoint[] };
  return body.history ?? [];
}
