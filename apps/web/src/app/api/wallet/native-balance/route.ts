import { createPublicClient, http, erc20Abi } from 'viem';
import { polygon } from 'viem/chains';
import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { env } from '@/lib/env';
import { POLYGON_USDC_NATIVE } from '@/features/wallet/lib/walletService';

// Authenticated CLOB read (account resolution + balance/allowance).
export const maxDuration = 60;

/**
 * `GET /wallet/native-balance` — the authenticated user's native (Circle)
 * USDC balance on Polygon, read directly on-chain. This is NOT the CLOB
 * collateral balance `/wallet/balance` reads (that's `POLYGON_USDC_E` on
 * the Deposit Wallet) — it's the *different* token that card/bank onramps
 * actually sell, landed in the user's own embedded wallet, polled by the
 * "Buy with card or bank" flow before triggering a swap into collateral.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) return Response.json({ raw: '0', usdc: 0 });

    const client = createPublicClient({ chain: polygon, transport: http(env.polygonRpcUrl) });
    const raw = await client.readContract({
      address: POLYGON_USDC_NATIVE,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet.address as `0x${string}`],
    });

    return Response.json({ raw: raw.toString(), usdc: Number(raw) / 1e6 });
  });
}
