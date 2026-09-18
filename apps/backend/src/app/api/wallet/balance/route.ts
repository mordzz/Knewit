import { fetchBalanceAllowance } from '@polymarket/client/actions';
import { AssetType } from '@polymarket/bindings/clob';
import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser } from '@/lib/trading/client';

// Authenticated CLOB read (account resolution + balance/allowance).
export const maxDuration = 60;

/**
 * `GET /wallet/balance` — the authenticated user's real collateral
 * balance **and allowances**, read from Polymarket's own CLOB through the
 * official `@polymarket/client` (`fetchBalanceAllowance`,
 * `AssetType.COLLATERAL`). Because the client resolves the account's
 * Deposit Wallet, this is the **deposit wallet's** balance — the funds
 * the venue actually spends (docs/WALLET.md, "Trading Requires
 * Polymarket's Deposit Wallet").
 *
 * `{ usdc: null, unavailable: true }` when the read can't happen (no
 * embedded wallet, missing Builder credentials, or a rejected
 * request). The clients render "—" for that case, never `$0.00`.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) return Response.json({ usdc: null, unavailable: true });

    try {
      const client = await buildSecureClientForUser(wallet.id);
      const result = await fetchBalanceAllowance(client, { assetType: AssetType.COLLATERAL });
      const usdc = Number(result.balance) / 1e6; // 6 decimals
      if (!Number.isFinite(usdc)) return Response.json({ usdc: null, unavailable: true });

      // BigInt values aren't JSON-serializable — send raw strings.
      const allowances: Record<string, string> = Object.fromEntries(
        Object.entries(result.allowances ?? {}).map(([spender, amount]) => [spender, String(amount)])
      );

      return Response.json({ usdc, allowances });
    } catch (error) {
      console.warn('[wallet/balance] balance read unavailable:', error);
      return Response.json({ usdc: null, unavailable: true });
    }
  });
}
