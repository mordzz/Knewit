import { createPublicClient } from '@polymarket/client';
import { listPositions } from '@polymarket/client/actions';
import { getDepositWalletAddress } from '@/lib/trading/depositWallet';
import { fetchMarketsByIds } from '@/lib/polymarket/gammaClient';
import type { UserPosition } from '@/types/social';

/**
 * Portfolio reads straight from Polymarket's Data API (`/positions` via the
 * SDK's `listPositions`) for the user's Deposit Wallet — the venue is the
 * source of truth for what's held, its average price, value, PnL and
 * whether it can be redeemed. Nothing about holdings is stored locally.
 */

const publicClient = createPublicClient();
const MAX_PAGES = 5;
const PAGE_SIZE = 100;

type DataPosition = Awaited<ReturnType<ReturnType<typeof listPositions>['firstPage']>>['items'][number];

/** Every position the wallet still holds something in — open ones, and
 * resolved winners waiting to be redeemed. Resolved losers (worth $0) are
 * left out. */
export async function listHeldPositions(depositWallet: string, conditionId?: string): Promise<DataPosition[]> {
  const paginator = listPositions(publicClient, {
    user: depositWallet,
    pageSize: PAGE_SIZE,
    ...(conditionId ? { conditionId } : {}),
  });
  const items: DataPosition[] = [];
  let pages = 0;
  for await (const page of paginator) {
    items.push(...page.items);
    if (++pages >= MAX_PAGES) break;
  }
  return items.filter((position) => {
    const size = Number(position.currentSize);
    if (!(size > 0)) return false;
    return !(position.redeemable && Number(position.currentValue) <= 0);
  });
}

const marketIdByCondition = new Map<string, string>();

/** Data API condition ids → our (Gamma) market ids, cached per instance. */
export async function resolveMarketIds(conditionIds: string[]): Promise<Map<string, string>> {
  const missing = [...new Set(conditionIds.map((id) => id.toLowerCase()))].filter((id) => !marketIdByCondition.has(id));
  for (let i = 0; i < missing.length; i += 50) {
    const markets = await fetchMarketsByIds('condition_ids', missing.slice(i, i + 50)).catch(() => []);
    for (const market of markets) marketIdByCondition.set(market.conditionId.toLowerCase(), String(market.id));
  }
  return new Map(
    conditionIds
      .map((id) => [id, marketIdByCondition.get(id.toLowerCase())] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
  );
}

/** Data API position → the `UserPosition` shape both clients render. The
 * id is the outcome token (asset) id — what sell/redeem/callouts take. */
export function toUserPosition(position: DataPosition, marketId: string | undefined): UserPosition {
  const cents = (value: unknown) => Number((Number(value) * 100).toFixed(4));
  return {
    id: String(position.assetId),
    marketId: marketId ?? '',
    marketQuestion: String(position.title ?? '(market unavailable)'),
    outcome: String(position.outcome),
    choiceIndex: Number(position.outcomeIndex),
    entryPrice: cents(position.avgPrice),
    currentPrice: position.currentPrice != null ? cents(position.currentPrice) : null,
    size: Number(position.currentSize),
    openedAt: new Date(Number(position.lastEventAt ?? Date.now())).toISOString(),
    conditionId: String(position.conditionId),
    valueUsd: Number(position.currentValue),
    pnlUsd: Number(position.totalPnl),
    redeemable: Boolean(position.redeemable),
  };
}

/** The viewer's portfolio (optionally one market's condition), newest
 * activity first. */
export async function getUserPortfolio(
  userId: string,
  privyUserId: string,
  conditionId?: string
): Promise<UserPosition[]> {
  const depositWallet = await getDepositWalletAddress(userId, privyUserId);
  if (!depositWallet) return [];
  const positions = await listHeldPositions(depositWallet, conditionId);
  const marketIds = await resolveMarketIds(positions.map((position) => String(position.conditionId)));
  return positions
    .map((position) => toUserPosition(position, marketIds.get(String(position.conditionId))))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}
