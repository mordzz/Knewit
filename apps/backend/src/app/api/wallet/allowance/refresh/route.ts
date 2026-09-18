import { updateBalanceAllowance } from '@polymarket/client/actions';
import { AssetType } from '@polymarket/bindings/clob';
import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser } from '@/lib/trading/client';

// Asks the CLOB to re-read on-chain state; same timeout as the balance read.
export const maxDuration = 60;

/**
 * `POST /wallet/allowance/refresh` — asks Polymarket's CLOB to re-read
 * the deposit wallet's on-chain collateral allowance
 * (`updateBalanceAllowance`), since `GET /wallet/balance` serves the
 * CLOB's cached value. Auth-required; failures surface the real error.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) return Response.json({ refreshed: false });

    const client = await buildSecureClientForUser(wallet.id);
    await updateBalanceAllowance(client, { assetType: AssetType.COLLATERAL });

    return Response.json({ refreshed: true });
  });
}
