import { ApiError } from '@/lib/apiError';
import { getPrimaryEthereumWallet, getOrCreateUser } from '@/lib/users';
import { buildSecureClientForUser, signerForUserWallet } from '@/lib/trading/client';
import { env } from '@/lib/env';
import { wrapDepositWalletUsdcE } from '@/lib/trading/collateral';
import { getSupabase } from '@/lib/supabase';
import { abandonWalletOperation, beginWalletOperation, updateWalletOperation } from '@/lib/walletOperations';
import { reconcileUserWalletOperations } from '@/lib/walletReconciliation';
import { forwardEmbeddedUsdcToBridge, isCardDepositEnabled } from '@/lib/deposits/forwardToBridge';

export interface ConversionResult {
  status: 'converted' | 'pending' | 'failed' | 'reconciliation_required';
  amountUsd: number;
  errorMessage: string | null;
}

export interface ConversionOutcome {
  body: ConversionResult;
  /** 200, or 202 while an on-chain step is still unresolved. */
  httpStatus: number;
}

function outcome(body: ConversionResult, httpStatus = 200): ConversionOutcome {
  return { body, httpStatus };
}

/**
 * Wraps the USDC.e that has landed in the user's Polymarket Deposit Wallet
 * into pUSD trading collateral — gasless, through Polymarket's relayer,
 * signed by the delegated backend key.
 *
 * Every deposit route ends here as USDC.e: crypto sent through the
 * Polymarket bridge (any supported token/network, bridged and swapped by
 * Polymarket) and USDC.e sent straight to the Deposit Wallet. Card
 * purchases (only when `NEXT_PUBLIC_CARD_DEPOSIT_ENABLED`) land as native
 * USDC in the embedded wallet first; this step forwards them to the bridge
 * with Privy-sponsored gas, and the next call wraps what arrives.
 *
 * Shared by `POST /wallet/convert-to-collateral` (the app asks) and the
 * Alchemy address-activity webhook (a deposit arrived) — one code path,
 * one ledger of wallet operations, so the two can never double-convert.
 */
export async function convertDepositForUser(
  privyUserId: string,
  idempotencyKey: string | null
): Promise<ConversionOutcome> {
  const viewer = await getOrCreateUser(privyUserId);
  await reconcileUserWalletOperations(viewer.id).catch((error) =>
    console.warn('[deposits/convert] prior operation reconciliation incomplete:', error)
  );
  const wallet = await getPrimaryEthereumWallet(privyUserId);
  if (!wallet) {
    throw new ApiError(400, 'no_wallet', 'No embedded wallet found for this account.');
  }
  if (!env.privyAuthorizationPrivateKey) {
    throw new ApiError(
      500,
      'authorization_key_missing',
      'PRIVY_AUTHORIZATION_PRIVATE_KEY is not configured — see docs/WALLET.md.'
    );
  }

  const client = await buildSecureClientForUser(wallet.id);
  const depositAddress = client.account.wallet;

  if (isCardDepositEnabled()) {
    const forwarded = await forwardEmbeddedUsdcToBridge({
      userId: viewer.id,
      walletId: wallet.id,
      embeddedAddress: wallet.address,
      depositWalletAddress: depositAddress,
      idempotencyKey,
    }).catch((error: unknown) => {
      console.error('[deposits/convert] forwarding card funds to the bridge failed:', error);
      return 'failed' as const;
    });
    if (forwarded === 'failed') {
      return outcome(
        {
          status: 'reconciliation_required',
          amountUsd: 0,
          errorMessage: "Your card purchase couldn't be moved to your trading wallet yet. It's safe in your wallet — try again shortly.",
        },
        202
      );
    }
    if (forwarded) {
      return outcome({
        status: 'pending',
        amountUsd: forwarded.amountUsd,
        errorMessage: 'Your card purchase is on its way to your trading wallet. It usually arrives within a few minutes.',
      });
    }
  }

  const { operation, started } = await beginWalletOperation(getSupabase(), {
    userId: viewer.id,
    type: 'deposit_wrap',
    request: { walletId: wallet.id, depositAddress },
    idempotencyKey,
  });
  if (!started) {
    if (operation.status === 'confirmed') {
      return outcome({ status: 'converted', amountUsd: Number(operation.result?.amountUsd ?? 0), errorMessage: null });
    }
    return outcome(
      {
        status: 'reconciliation_required',
        amountUsd: 0,
        errorMessage: 'Your deposit is still being reconciled. Check your trading balance before retrying.',
      },
      202
    );
  }

  try {
    const wrapped = await wrapDepositWalletUsdcE(client, signerForUserWallet(wallet.id), async (transaction) => {
      await updateWalletOperation(getSupabase(), operation.id, {
        status: 'submitted',
        transaction_id: transaction.transactionId,
        transaction_hash: transaction.transactionHash,
        request: { walletId: wallet.id, depositAddress, amount: transaction.amount },
      });
    });
    if (wrapped.status === 'pending') {
      // Nothing was submitted on-chain (the funds just haven't landed
      // yet) — not a real failure, and nothing to reconcile. Undo the
      // reservation entirely instead of leaving a row that would either
      // misreport this as 'failed' in the audit ledger, or, if left
      // 'pending', block every future deposit-wrap attempt for this user
      // (nothing ever moves a 'pending' row out of the one-active-per-type
      // set on its own).
      await abandonWalletOperation(getSupabase(), operation.id);
      return outcome({ status: 'pending', amountUsd: 0, errorMessage: 'Your deposit has not arrived yet. Try again shortly.' });
    }
    const amountUsd = Number(wrapped.amount) / 1e6;
    await updateWalletOperation(getSupabase(), operation.id, {
      status: 'confirmed',
      result: { amountUsd },
      reconciled_at: new Date().toISOString(),
    });
    return outcome({ status: 'converted', amountUsd, errorMessage: null });
  } catch (error) {
    await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
    console.error('[deposits/convert] wrap outcome requires backend reconciliation:', error);
    return outcome(
      {
        status: 'reconciliation_required',
        amountUsd: 0,
        errorMessage: 'Your conversion is being verified. Check your trading balance before trying again.',
      },
      202
    );
  }
}
