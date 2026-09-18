import { badRequest, withErrorHandling } from '@/lib/apiError';
import { DEFAULT_PAGE_SIZE, parseCursor } from '@/lib/pagination';
import { fetchLeaderboardPage } from '@/lib/polymarket/dataApiClient';
import { toLeaderboardEntry } from '@/lib/leaderboard';
import type { LeaderboardEntry, LeaderboardPage } from '@/types/leaderboard';

/**
 * `GET /leaderboard?cursor=` — the ranked traders are **Polymarket's own
 * live leaderboard** (`data-api.polymarket.com`, volume only, all-time;
 * see `lib/polymarket/dataApiClient.ts`), not a local aggregation.
 *
 * Why live: this app's own `orders` table is empty by construction until a
 * trade actually fills (Phase 3's trading flow is still unverified — see
 * `lib/trading/orders.ts`), so ranking our own rows produced a permanently
 * empty leaderboard. Polymarket, which *does* have the fills, publishes the
 * ranking — with the same volume-only metric this app already documented
 * (docs/DECISIONS.md, "Leaderboard Metric — Trading Volume Only, Not
 * PnL"). No PnL/ROI figure is read from it, and no period or category
 * control is exposed (`ALL`/`OVERALL` are fixed), so no cosmetic filter
 * exists.
 *
 * There is one scope, and it is global. Polymarket's users and this app's
 * users are two different populations, so this list is deliberately not a
 * social surface: no follow state, no profile links, no `scope=following`.
 * Each row is a ranked Polymarket trader whose `user.id` is their proxy
 * wallet address — the only identity Polymarket gives, never a synthesized
 * Knewit account and never a follow target (docs/DECISIONS.md, "Round 6:
 * Leaderboard Is a Read-Only Polymarket Ranking — No Follow, No Profile
 * Links"). `users` is not consulted here at all any more, so browsing the
 * leaderboard can neither resolve nor create a local account.
 *
 * By request there is **no viewer-relative figure at all** any more: the
 * old `currentUser`/"Your Rank" self-standing row was removed (UI +
 * backend), so this response is purely the ranking itself (docs/DECISIONS.md,
 * "Your Rank Removed From the Leaderboard").
 *
 * `?scope=` is still parsed so a client built before this round is told
 * plainly that the following scope is gone, instead of silently being
 * handed a different list than it asked for; `scope=global` stays valid.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);

    const scopeParam = url.searchParams.get('scope');
    if (scopeParam !== null && scopeParam !== 'global') {
      throw badRequest(
        `Unknown scope "${scopeParam}". This leaderboard is always Polymarket's global ranking; there is no following scope.`
      );
    }

    const offset = parseCursor(url.searchParams.get('cursor'));
    const rows = await fetchLeaderboardPage(DEFAULT_PAGE_SIZE, offset);
    const items = rows
      .map(toLeaderboardEntry)
      .filter((entry): entry is LeaderboardEntry => entry !== null);

    const page: LeaderboardPage = {
      items,
      nextCursor: rows.length === DEFAULT_PAGE_SIZE ? String(offset + DEFAULT_PAGE_SIZE) : null,
    };
    return Response.json(page);
  });
}
