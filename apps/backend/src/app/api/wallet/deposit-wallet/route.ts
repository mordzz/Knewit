import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser } from '@/lib/trading/client';

/**
 * `GET /wallet/deposit-wallet` — ensures the authenticated wallet's
 * Polymarket **Deposit Wallet** exists (the official client derives it
 * deterministically and deploys it through Polymarket's gasless relayer
 * when missing) and returns the resolved account identity. This wallet —
 * not the raw EOA — is what the CLOB accepts as maker and what holds
 * trading funds (docs/WALLET.md).
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) return Response.json({ address: null, walletType: null, unavailable: true });

    const client = await buildSecureClientForUser(wallet.id);
    return Response.json({
      address: client.account.wallet,
      walletType: client.account.walletType,
      signer: client.account.signer,
    });
  });
}
