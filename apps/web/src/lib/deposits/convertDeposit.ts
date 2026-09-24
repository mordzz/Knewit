import { createPublicClient, http, erc20Abi } from 'viem';
import { polygon } from 'viem/chains';
import { ApiError } from '@/lib/apiError';
import { getPrimaryEthereumWallet, getOrCreateUser } from '@/lib/users';
import { buildSecureClientForUser, signerForUserWallet } from '@/lib/trading/client';
import { getPrivyClient } from '@/lib/privyClient';
import { env } from '@/lib/env';
import { wrapDepositWalletUsdcE } from '@/lib/trading/collateral';
import { POLYGON_CAIP2, POLYGON_USDC_E, POLYGON_USDC_NATIVE } from '@/features/wallet/lib/walletService';
import { getSupabase } from '@/lib/supabase';
import { abandonWalletOperation, beginWalletOperation, updateWalletOperation } from '@/lib/walletOperations';
import { reconcileUserWalletOperations } from '@/lib/walletReconciliation';

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
 * Turns whatever deposit has landed for this user into pUSD trading
 * collateral: native USDC in the embedded wallet is swapped (Privy swap,
 * signed by the delegated backend key) into USDC.e delivered to the
 * Polymarket Deposit Wallet, and USDC.e there is wrapped. Shared by
 * `POST /wallet/convert-to-collateral` (the app asks) and the Alchemy
 * address-activity webhook (a deposit arrived) — one code path, one
 * ledger of wallet operations, so the two can never double-convert.
 *
 * A failed or rejected swap is reported as unresolved. Multi-step wallet
 * actions can have confirmed on-chain steps before a later step fails, so
 * callers must not assume the source balance is unchanged or retry blindly.
 */
export async function convertDepositForUser(
  privyUserId: string,
  idempotencyKey: string | null
): Promise<ConversionOutcome> {
    const viewer = await getOrCreateUser(privyUserId);
    await reconcileUserWalletOperations(viewer.id).catch((error) => console.warn('[deposits/convert] prior operation reconciliation incomplete:', error));
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

    // Resolve/deploy the Deposit Wallet first — the swap's destination
    // address must exist (or be deployable by the time the swap lands).
    const client = await buildSecureClientForUser(wallet.id);
    const depositAddress = client.account.wallet;

    const publicClient = createPublicClient({ chain: polygon, transport: http(env.polygonRpcUrl) });
    const nativeBalance = await publicClient.readContract({
      address: POLYGON_USDC_NATIVE,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet.address as `0x${string}`],
    });

    const wrapDeposit = async () => {
      const { operation, started } = await beginWalletOperation(getSupabase(), {
        userId: viewer.id,
        type: 'deposit_wrap',
        request: { walletId: wallet.id, depositAddress },
        idempotencyKey: idempotencyKey,
      });
      if (!started) {
        if (operation.status === 'confirmed') {
          return outcome({ status: 'converted', amountUsd: Number(operation.result?.amountUsd ?? 0), errorMessage: null });
        }
        return outcome({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your deposit is still being reconciled. Check your trading balance before retrying.' }, 202);
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
          // reservation entirely instead of leaving a row that would
          // either misreport this as 'failed' in the audit ledger, or, if
          // left 'pending', block every future deposit-wrap attempt for
          // this user (nothing ever moves a 'pending' row out of the
          // one-active-per-type set on its own).
          await abandonWalletOperation(getSupabase(), operation.id);
          return outcome({ status: 'pending', amountUsd: 0, errorMessage: 'USDC.e has not arrived yet. Try Deposit again shortly.' });
        }
        const amountUsd = Number(wrapped.amount) / 1e6;
        await updateWalletOperation(getSupabase(), operation.id, { status: 'confirmed', result: { amountUsd }, reconciled_at: new Date().toISOString() });
        return outcome({ status: 'converted', amountUsd, errorMessage: null });
      } catch (error) {
        await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
        console.error('[deposits/convert] wrap outcome requires backend reconciliation:', error);
        return outcome({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your conversion is being verified. Check your trading balance before trying again.' }, 202);
      }
    };

    if (nativeBalance <= BigInt(0)) {
      return wrapDeposit();
    }

    const swapOperation = await beginWalletOperation(getSupabase(), {
      userId: viewer.id,
      type: 'deposit_swap',
      request: { walletId: wallet.id, nativeBalance: nativeBalance.toString(), depositAddress },
      idempotencyKey: idempotencyKey,
    });
    let swapSucceeded = swapOperation.operation.status === 'confirmed';
    if (!swapOperation.started && swapOperation.operation.provider_action_id) {
      try {
        const action = await getPrivyClient().wallets().actions.get(swapOperation.operation.provider_action_id, { wallet_id: wallet.id });
        if (action.status === 'succeeded') {
          swapSucceeded = true;
          await updateWalletOperation(getSupabase(), swapOperation.operation.id, { status: 'confirmed', result: { actionId: action.id }, reconciled_at: new Date().toISOString() });
        } else if (action.status === 'failed' || action.status === 'rejected') {
          await updateWalletOperation(getSupabase(), swapOperation.operation.id, { status: 'failed', error_code: action.status });
          return outcome({ status: 'failed', amountUsd: 0, errorMessage: 'The conversion failed. Check your trading balance before starting another conversion.' });
        } else {
          return outcome({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your conversion is still processing. Check your trading balance before trying again.' }, 202);
        }
      } catch (error) {
        console.warn('[deposits/convert] existing swap action lookup failed:', error);
        return outcome({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your conversion is being verified. Check your trading balance before trying again.' }, 202);
      }
    }
    if (!swapOperation.started && !swapOperation.operation.provider_action_id && swapOperation.operation.status !== 'pending') {
      return outcome({ status: 'pending', amountUsd: 0, errorMessage: 'Your previous conversion is being reconciled. Check your trading balance before trying again.' }, 202);
    }

    const privy = getPrivyClient();
    const authorizationContext = { authorization_private_keys: [env.privyAuthorizationPrivateKey] };
    const source = { asset_address: POLYGON_USDC_NATIVE, caip2: POLYGON_CAIP2 };
    const destination = { asset_address: POLYGON_USDC_E, caip2: POLYGON_CAIP2, destination_address: depositAddress };

    if (!swapSucceeded) {
      try {
        const result = await privy.wallets().swaps().execute(wallet.id, {
        base_amount: nativeBalance.toString(),
        source,
        destination,
        amount_type: 'exact_input',
        // Stablecoin-to-stablecoin — 1% covers normal pool spread without
        // being loose enough to matter if the price ever meaningfully
        // diverges from 1:1.
        slippage_bps: 100,
        authorization_context: authorizationContext,
        idempotency_key: swapOperation.operation.id,
      });
        await updateWalletOperation(getSupabase(), swapOperation.operation.id, {
          provider_action_id: result.id,
          provider_wallet_id: wallet.id,
          status: result.status === 'succeeded' ? 'confirmed' : result.status === 'failed' || result.status === 'rejected' ? 'failed' : 'submitted',
          result: { actionId: result.id },
          error_code: result.status === 'failed' || result.status === 'rejected' ? result.status : null,
        });
        if (result.status === 'failed' || result.status === 'rejected') {
          return outcome({ status: 'failed', amountUsd: 0, errorMessage: 'The conversion failed. Check your trading balance before starting another conversion.' });
        }
        if (result.status !== 'succeeded') {
          return outcome({ status: 'pending', amountUsd: 0, errorMessage: 'Your conversion is still processing. Check your trading balance before trying again.' }, 202);
        }
      } catch (error) {
        await updateWalletOperation(getSupabase(), swapOperation.operation.id, { status: 'reconciliation_required' });
        console.error('[deposits/convert] swap outcome requires backend reconciliation:', error);
        return outcome({ status: 'pending', amountUsd: 0, errorMessage: 'Your conversion is being verified. Check your trading balance before trying again.' }, 202);
      }
    }
    return wrapDeposit();
}
