import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { AssetType } from '@polymarket/clob-client';
import { buildClobClientForUser } from '@/lib/trading/clobClient';

/**
 * `POST /wallet/allowance/refresh` — tells Polymarket's CLOB to re-read
 * the wallet's on-chain collateral allowance (`updateBalanceAllowance`)
 * after the client sent an `approve` transaction. `GET /wallet/balance`
 * reads the CLOB's cache, so without this the new allowance wouldn't show
 * up until the cache expires (docs/API.md, "Approve USDC for Trading").
 *
 * Auth-required; failures surface Polymarket's real error, never a
 * fabricated success.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) return Response.json({ refreshed: false });

    const clobClient = await buildClobClientForUser(wallet.id, wallet.address);
    await clobClient.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });

    return Response.json({ refreshed: true });
  });
}
