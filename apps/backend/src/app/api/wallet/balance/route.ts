import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { AssetType, Chain, getContractConfig } from '@polymarket/clob-client';
import { buildClobClientForUser } from '@/lib/trading/clobClient';

/**
 * `GET /wallet/balance` — the authenticated wallet's real USDC collateral
 * balance **and allowances**, read from Polymarket's own CLOB
 * (`getBalanceAllowance`, `AssetType.COLLATERAL`) — the exact funds and
 * approvals the trading flow spends/needs, no third-party RPC, no
 * fabricated figure (docs/WALLET.md).
 *
 * The CLOB's response carries `allowances` as a map of spender contract →
 * raw allowance (the exact spenders the CLOB checks for this wallet;
 * treat that map as the source of truth rather than any hardcoded
 * exchange address). `collateral` is the token those allowances are for,
 * from the CLOB's own `getContractConfig` — what the client's `approve`
 * transaction must target.
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
      // The installed SDK's type says `allowance: string`, but the live
      // API responds with `allowances: Record<spender, string>` — read
      // both shapes so a newer/older SDK keeps working.
      const result = (await clobClient.getBalanceAllowance({
        asset_type: AssetType.COLLATERAL,
      })) as { balance: string; allowance?: string; allowances?: Record<string, string> };

      const usdc = Number(result.balance) / 1e6; // USDC has 6 decimals
      if (!Number.isFinite(usdc)) return Response.json({ usdc: null, unavailable: true });

      const contracts = getContractConfig(Chain.POLYGON);
      const allowances: Record<string, string> =
        result.allowances ??
        (result.allowance ? { [contracts.exchange]: result.allowance } : {});

      return Response.json({
        usdc,
        allowances,
        collateral: contracts.collateral,
      });
    } catch (error) {
      console.warn('[wallet/balance] balance read unavailable:', error);
      return Response.json({ usdc: null, unavailable: true });
    }
  });
}
