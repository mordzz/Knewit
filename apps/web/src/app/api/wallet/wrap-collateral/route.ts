import { withErrorHandling, ApiError } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser, signerForUserWallet } from '@/lib/trading/client';
import { wrapDepositWalletUsdcE } from '@/lib/trading/collateral';
import { env } from '@/lib/env';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { abandonWalletOperation, beginWalletOperation, updateWalletOperation } from '@/lib/walletOperations';
import { reconcileUserWalletOperations } from '@/lib/walletReconciliation';

export const maxDuration = 60;

/** Converts USDC.e that has arrived in the user's Polymarket Deposit Wallet into pUSD trading collateral. */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    if (process.env.NEXT_PUBLIC_TRADING_ENABLED !== 'true') {
      throw new ApiError(503, 'trading_unavailable', 'Deposits are temporarily unavailable.');
    }
    if (!env.privyAuthorizationPrivateKey) {
      throw new ApiError(503, 'authorization_key_missing', 'Deposit conversion is not configured yet.');
    }
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await reconcileUserWalletOperations(viewer.id).catch((error) => console.warn('[wallet/wrap-collateral] prior operation reconciliation incomplete:', error));
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) throw new ApiError(400, 'no_wallet', 'No embedded wallet found for this account.');
    const client = await buildSecureClientForUser(wallet.id);
    const { operation, started } = await beginWalletOperation(getSupabase(), {
      userId: viewer.id,
      type: 'deposit_wrap',
      request: { walletId: wallet.id, depositAddress: client.account.wallet },
      idempotencyKey: request.headers.get('idempotency-key'),
    });
    if (!started) {
      if (operation.status === 'confirmed') {
        return Response.json({ status: 'converted', amountUsd: Number(operation.result?.amountUsd ?? 0), errorMessage: null });
      }
      return Response.json({ status: 'pending', amountUsd: 0, errorMessage: 'Your deposit conversion is already being reconciled. Check your trading balance before retrying.' }, { status: 202 });
    }
    let result;
    try {
      result = await wrapDepositWalletUsdcE(client, signerForUserWallet(wallet.id), async (transaction) => {
        await updateWalletOperation(getSupabase(), operation.id, {
          status: 'submitted',
          transaction_id: transaction.transactionId,
          transaction_hash: transaction.transactionHash,
          request: { walletId: wallet.id, depositAddress: client.account.wallet, amount: transaction.amount },
        });
      });
    } catch (error) {
      await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
      console.error('[wallet/wrap-collateral] wrap result unresolved:', error);
      return Response.json({ status: 'reconciliation_required', amountUsd: 0, errorMessage: error instanceof Error ? error.message : 'The wrap status is unresolved. Check your trading balance before retrying.' }, { status: 202 });
    }
    if (result.status === 'pending') {
      // Nothing was submitted on-chain (the funds just haven't landed
      // yet) — not a real failure, and nothing to reconcile. Undo the
      // reservation entirely; see `abandonWalletOperation`'s doc comment
      // for why leaving this 'failed' or 'pending' is wrong either way.
      await abandonWalletOperation(getSupabase(), operation.id);
    } else {
      await updateWalletOperation(getSupabase(), operation.id, {
        status: 'confirmed',
        result: { amountUsd: Number(result.amount) / 1e6 },
        reconciled_at: new Date().toISOString(),
      });
    }
    return Response.json({
      status: result.status === 'wrapped' ? 'converted' : 'pending',
      amountUsd: Number(result.amount) / 1e6,
      errorMessage: result.status === 'pending' ? 'Your USDC.e deposit has not arrived yet.' : null,
    });
  });
}
