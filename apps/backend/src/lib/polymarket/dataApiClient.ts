import { env } from '@/lib/env';
import { upstreamError } from '@/lib/apiError';
import { normalizeWalletAddress } from '@/lib/polymarket/address';

/**
 * Polymarket's **Data API** (`https://data-api.polymarket.com`) — a
 * different service from the Gamma API `gammaClient.ts` talks to, and the
 * only place Polymarket publishes an actual ranked-trader leaderboard
 * (Gamma has no rankings endpoint at all; verified live). Same rules as
 * the Gamma client: public, no key, read-only, no Supabase involvement.
 *
 * `data-api.polymarket.com` has no published OpenAPI document; every
 * parameter and field below was verified against the live endpoint:
 * `GET /v1/leaderboard?timePeriod=ALL&orderBy=VOL&category=OVERALL&limit=3&offset=0`
 * returns an **array** of rows in rank order
 * (`rank` as a *string*, `proxyWallet`, `userName`, `xUsername`,
 * `verifiedBadge`, `vol`, `pnl`, `profileImage`), `user=<address>` filters
 * to one trader (still an array, `[]` when the address has no ranked
 * volume), and `user=` accepts a **comma-separated list** — which is what
 * makes the "Following" scope one upstream call instead of one per
 * followed trader. `offset` pages in rank order (verified past 1000).
 */

export interface PolymarketLeaderboardRow {
  rank: string;
  proxyWallet: string;
  userName: string;
  xUsername: string;
  verifiedBadge: boolean;
  vol: number;
  pnl: number;
  profileImage: string;
}

/** Volume only, never PnL — docs/DECISIONS.md, "Leaderboard Metric —
 * Trading Volume Only, Not PnL." `timePeriod=ALL` because this app has no
 * period selector (docs/DECISIONS.md, "No Period or Category Filter") and
 * `category=OVERALL` for the same reason: every ranked number this API
 * returns, on every endpoint, comes from this one window, so a profile's
 * volume and the leaderboard's volume can never disagree.
 *
 * (`orderBy=VOL` is Polymarket's own parameter name; it sorts descending
 * by `vol`.) */
const LEADERBOARD_WINDOW = {
  timePeriod: 'ALL',
  orderBy: 'VOL',
  category: 'OVERALL',
} as const;

/** Polymarket's own `user=` filter takes a comma-separated list; chunks
 * keep the query string (and therefore the URL) a sane length. */
const WALLETS_PER_LOOKUP = 25;

async function dataGet<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${env.polymarketDataBaseUrl}${path}`);
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

/** The endpoint is documented (here) as returning an array, but a
 * single-address lookup has been observed to come back as a bare object —
 * accept both rather than let a shape change throw a `TypeError` inside a
 * route. Anything else is treated as "no rows", never as a fake row. */
function toRows(payload: unknown): PolymarketLeaderboardRow[] {
  if (Array.isArray(payload)) return payload as PolymarketLeaderboardRow[];
  if (payload && typeof payload === 'object' && 'proxyWallet' in payload) {
    return [payload as PolymarketLeaderboardRow];
  }
  return [];
}

/** One page of the global ranking, in rank order. */
export async function fetchLeaderboardPage(limit: number, offset: number): Promise<PolymarketLeaderboardRow[]> {
  const payload = await dataGet<unknown>('/v1/leaderboard', {
    ...LEADERBOARD_WINDOW,
    limit,
    offset,
  });
  return toRows(payload);
}

/** The ranked rows for a specific set of wallets — used by
 * `scope=following`. An address with no ranked volume is simply absent
 * from the result, which is what makes an unranked follow honestly
 * unranked rather than rank 0. */
export async function fetchLeaderboardRowsForWallets(wallets: string[]): Promise<PolymarketLeaderboardRow[]> {
  const unique = Array.from(new Set(wallets.map(normalizeWalletAddress)));
  if (unique.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += WALLETS_PER_LOOKUP) {
    chunks.push(unique.slice(i, i + WALLETS_PER_LOOKUP));
  }

  const pages = await Promise.all(
    chunks.map((chunk) =>
      dataGet<unknown>('/v1/leaderboard', {
        ...LEADERBOARD_WINDOW,
        limit: chunk.length,
        user: chunk.join(','),
      }).then(toRows)
    )
  );

  return pages.flat();
}

/** One trader's own row, or `null` when Polymarket has no ranked volume
 * for that address. Backs both `currentUser` (the viewer's own rank) and
 * `lib/leaderboard.ts::fetchPolymarketStanding` (the profile's
 * `tradingVolume`/`leaderboardRank`). */
export async function fetchLeaderboardRowForWallet(wallet: string): Promise<PolymarketLeaderboardRow | null> {
  const rows = await fetchLeaderboardRowsForWallets([wallet]);
  return rows[0] ?? null;
}
