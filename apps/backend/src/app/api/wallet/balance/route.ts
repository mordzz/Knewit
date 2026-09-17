import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { AssetType } from '@polymarket/clob-client';
import { buildClobClientForUser } from '@/lib/trading/clobClient';

/**
 * `GET /wallet/balance` — the authenticated wallet's real USDC collateral
 * balance, read from Polymarket's own CLOB (`getBalanceAllowance`,
 * `AssetType.COLLATERAL`) — the exact funds the trading flow spends, no
 * third-party RPC, no fabricated figure (docs/WALLET.md).
 *
 * `{ usdc: null, unavailable: true }` when the read can't happen (no
 * embedded wallet, or CLOB L2 auth rejected — most likely because the
 * wallet hasn't delegated signing authority to the app yet, see
 * `privyClobSigner.ts`). The client renders "—" for that case, never
 * `$0.00`.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) return Response.json({ usdc: null, unavailable: true });

    try {
      const clobClient = await buildClobClientForUser(wallet.id, wallet.address);
      const { balance } = await clobClient.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
      const usdc = Number(balance) / 1e6; // USDC has 6 decimals
      if (!Number.isFinite(usdc)) return Response.json({ usdc: null, unavailable: true });
      return Response.json({ usdc });
    } catch (error) {
      console.warn('[wallet/balance] balance read unavailable:', error);
      return Response.json({ usdc: null, unavailable: true });
    }
  });
}
