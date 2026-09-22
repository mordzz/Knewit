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
 * The documented v1 endpoint was also verified against the live service:
 * `GET /v1/leaderboard?timePeriod=ALL&orderBy=VOL&category=OVERALL&limit=3&offset=0`
 * returns an **array** of rows in rank order
 * (`rank` as a *string*, `proxyWallet`, `userName`, `xUsername`,
 * `verifiedBadge`, `vol`, `pnl`, `profileImage`), `user=<address>` filters
 * to one trader (still an array, `[]` when the address has no ranked
 * volume), `user=` accepts a **comma-separated list**, and `userName=`
 * filters to one leaderboard username. `offset` pages in rank order
 * (verified past 1000).
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

/** Look up one username in the same all-time, overall leaderboard used by
 * the app. The upstream `userName` filter avoids downloading and scanning
 * leaderboard pages when validating a profile handle. */
export async function fetchLeaderboardRowsForUsername(
  userName: string
): Promise<PolymarketLeaderboardRow[]> {
  const payload = await dataGet<unknown>('/v1/leaderboard', {
    ...LEADERBOARD_WINDOW,
    userName,
  });

  const isRow = (row: unknown): row is PolymarketLeaderboardRow =>
    typeof row === 'object' &&
    row !== null &&
    'userName' in row &&
    typeof row.userName === 'string';

  if (Array.isArray(payload)) {
    if (!payload.every(isRow)) {
      throw upstreamError('Polymarket returned an invalid username search response.');
    }
    return payload as PolymarketLeaderboardRow[];
  }
  if (isRow(payload)) return [payload];

  throw upstreamError('Polymarket returned an invalid username search response.');
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
 * for that address. Backs `lib/leaderboard.ts::fetchPolymarketStanding`
 * (the profile's `tradingVolume`). */
export async function fetchLeaderboardRowForWallet(wallet: string): Promise<PolymarketLeaderboardRow | null> {
  const rows = await fetchLeaderboardRowsForWallets([wallet]);
  return rows[0] ?? null;
}

/**
 * One holder of a market's outcome token, straight from Polymarket's
 * Data API `GET /holders?market=<conditionId>&limit=&offset=` (verified
 * live; takes the condition id, not our market id, and returns groups
 * keyed by outcome token). Public names are only shown when
 * `displayUsernamePublic` is true — otherwise callers fall back to a
 * shortened proxy-wallet address, never an invented handle.
 */
export interface PolymarketHolder {
  proxyWallet: string;
  name: string;
  pseudonym: string;
  profileImage: string;
  profileImageOptimized: string;
  outcomeIndex: number;
  amount: number;
  displayUsernamePublic: boolean;
}

interface PolymarketHolderGroup {
  token: string;
  holders: PolymarketHolder[];
}

/** The top holders of one market, largest position first. */
export async function fetchMarketHolders(
  conditionId: string,
  limit: number,
  offset = 0
): Promise<PolymarketHolder[]> {
  const payload = await dataGet<unknown>('/holders', { market: conditionId, limit, offset });
  if (!Array.isArray(payload)) return [];

  const groups = payload as PolymarketHolderGroup[];
  return groups
    .flatMap((group) => (Array.isArray(group.holders) ? group.holders : []))
    .sort((a, b) => b.amount - a.amount);
}
