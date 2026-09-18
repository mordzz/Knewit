import {
  isWalletAddress,
  normalizeWalletAddress,
  shortenWalletAddress,
} from "@/lib/polymarket/address";
import {
  fetchLeaderboardRowForWallet,
  type PolymarketLeaderboardRow,
} from "@/lib/polymarket/dataApiClient";
import type { LeaderboardEntry, LeaderboardSelf } from "@/types/leaderboard";

/**
 * Ranking → `LeaderboardEntry` mapping for `GET /leaderboard`, and the
 * own-standing lookup the profile read uses (`buildUserProfile`), so a rank
 * or a volume figure means exactly the same thing everywhere it appears —
 * docs/DECISIONS.md, "Profile Trading Metric Matches Leaderboard's
 * Definition Exactly."
 *
 * The ranking itself is Polymarket's own live one (see
 * `lib/polymarket/dataApiClient.ts`); this file only translates it into
 * this app's response shapes. It attaches nothing about this app's own
 * accounts: Polymarket's users and this app's users are two different
 * populations, so a ranked wallet is never resolved to a `users` row and
 * never synthesized into one — docs/DECISIONS.md, "Round 6: Leaderboard Is
 * a Read-Only Polymarket Ranking — No Follow, No Profile Links."
 */

/**
 * One ranked trader, under Polymarket's own identity: their proxy wallet
 * address as the list key, and Polymarket's `userName`/`profileImage` (a
 * blank `userName` falls back to a shortened address — never an invented
 * handle). That `id` is **never** a `users` row id, and is never a profile
 * or follow target; it is a list key and nothing more, which is exactly
 * what "no profile links on the leaderboard" means in code.
 *
 * Returns `null` for a row Polymarket returned without a usable rank,
 * volume, or wallet address, rather than coercing it to `0` — a fabricated
 * "rank 0" or "$0" row is worse than an omitted one.
 */
export function toLeaderboardEntry(row: PolymarketLeaderboardRow): LeaderboardEntry | null {
  const rank = Number(row.rank);
  const volume = Number(row.vol);
  if (!Number.isFinite(rank) || !Number.isFinite(volume)) return null;
  if (typeof row.proxyWallet !== "string" || !isWalletAddress(row.proxyWallet)) return null;

  const walletAddress = normalizeWalletAddress(row.proxyWallet);
  const userName = typeof row.userName === "string" ? row.userName.trim() : "";
  const name = userName || shortenWalletAddress(walletAddress);

  return {
    rank,
    user: {
      id: walletAddress,
      handle: name,
      displayName: name,
      avatarUrl: row.profileImage || null,
    },
    metric: { name: "volume", value: volume },
  };
}

/** The viewer's own rank, straight from Polymarket's ranking — never
 * computed here from a single fetched page. */
export function toLeaderboardSelf(row: PolymarketLeaderboardRow): LeaderboardSelf | null {
  const rank = Number(row.rank);
  const volume = Number(row.vol);
  if (!Number.isFinite(rank) || !Number.isFinite(volume)) return null;
  return { rank, metric: { name: "volume", value: volume } };
}

/**
 * A single wallet's live standing, for the profile read's
 * `tradingVolume`. `null` when this account has no
 * wallet, Polymarket has no ranked volume for that wallet, or the upstream
 * call fails �?" never a local `orders` sum standing in for the metric the
 * leaderboard actually shows (docs/DECISIONS.md).
 */
export async function fetchPolymarketStanding(
  walletAddress: string | null,
): Promise<{ volume: number; rank: number } | null> {
  if (!walletAddress) return null;
  try {
    const row = await fetchLeaderboardRowForWallet(walletAddress);
    const self = row ? toLeaderboardSelf(row) : null;
    return self ? { volume: self.metric.value, rank: self.rank } : null;
  } catch {
    return null;
  }
}
