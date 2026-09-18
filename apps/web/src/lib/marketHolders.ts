import { fetchMarketHolders } from "@/lib/polymarket/dataApiClient";
import { parseChoices } from "@/lib/polymarket/normalize";
import type { GammaMarket } from "@/lib/polymarket/gammaTypes";

/** A holder row resolved from Polymarket's public holder data, with the
 * market's own choice label instead of a raw token index. */
export interface ResolvedHolder {
  proxyWallet: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  outcome: string;
  shares: number;
}

function shortAddress(wallet: string): string {
  return wallet.length > 10 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet;
}

/**
 * Polymarket's Data API is the source of truth for holders — our own
 * `positions` table only ever contains trades this app executed, which
 * is why that table-backed version looked permanently empty. Maps each
 * holder's `outcomeIndex` onto the market's own choice label and only
 * uses a public name when Polymarket marks it public; otherwise a
 * shortened proxy-wallet address, never an invented handle
 * (docs/DECISIONS.md, "Holders Come From Polymarket's Data API").
 */
export async function resolveMarketHolders(
  market: GammaMarket,
  limit: number,
): Promise<ResolvedHolder[]> {
  const holders = await fetchMarketHolders(market.conditionId, limit);
  const choices = parseChoices(market);

  return holders.map((holder) => {
    const isPublic = holder.displayUsernamePublic;
    const publicName = isPublic ? holder.name || holder.pseudonym : "";
    const pseudonym = isPublic ? holder.pseudonym : "";
    return {
      proxyWallet: holder.proxyWallet,
      displayName: publicName || shortAddress(holder.proxyWallet),
      handle: pseudonym || shortAddress(holder.proxyWallet),
      avatarUrl: holder.profileImage || holder.profileImageOptimized || null,
      outcome: choices[holder.outcomeIndex]?.label ?? (holder.outcomeIndex === 0 ? "Yes" : "No"),
      shares: holder.amount,
    };
  });
}
