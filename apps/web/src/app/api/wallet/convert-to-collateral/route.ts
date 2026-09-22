import { createPublicClient, http, erc20Abi } from 'viem';
import { polygon } from 'viem/chains';
import { ApiError, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser, signerForUserWallet } from '@/lib/trading/client';
import { getPrivyClient } from '@/lib/privyClient';
import { env } from '@/lib/env';
import { wrapDepositWalletUsdcE } from '@/lib/trading/collateral';
import { POLYGON_CAIP2, POLYGON_USDC_E, POLYGON_USDC_NATIVE } from '@/features/wallet/lib/walletService';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { abandonWalletOperation, beginWalletOperation, updateWalletOperation } from '@/lib/walletOperations';
import { reconcileUserWalletOperations } from '@/lib/walletReconciliation';

// Quote + execute + (indirectly) wait on a relayer-deployed Deposit
// Wallet — same budget as the other trading/wallet routes that touch the
// Polymarket relayer or a Privy wallet action.
export const maxDuration = 60;

/**
 * `POST /wallet/convert-to-collateral` — swaps the caller's embedded-wallet
 * native USDC (what card/bank onramps actually sell — see
 * `POLYGON_USDC_NATIVE`'s doc comment) into USDC.e, delivered straight to
 * their Polymarket Deposit Wallet. Uses Privy's own Uniswap-backed swap
 * resource (`wallets().swaps()`), signed by the same delegated backend
 * signer (`PRIVY_AUTHORIZATION_PRIVATE_KEY`) that already signs trading
 * orders — the user granted this once via `addSigners` during automatic
 * wallet setup, no fresh per-swap prompt.
 *
 * A failed or rejected swap is reported as unresolved. Multi-step wallet
 * actions can have confirmed on-chain steps before a later step fails, so
 * the client must not assume the source balance is unchanged or retry blindly.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await reconcileUserWalletOperations(viewer.id).catch((error) => console.warn('[wallet/convert-to-collateral] prior operation reconciliation incomplete:', error));
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
        idempotencyKey: request.headers.get('idempotency-key'),
      });
      if (!started) {
        if (operation.status === 'confirmed') {
          return Response.json({ status: 'converted', amountUsd: Number(operation.result?.amountUsd ?? 0), errorMessage: null });
        }
        return Response.json({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your deposit is still being reconciled. Check your trading balance before retrying.' }, { status: 202 });
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
          return Response.json({ status: 'pending', amountUsd: 0, errorMessage: 'USDC.e has not arrived yet. Try Deposit again shortly.' });
        }
        const amountUsd = Number(wrapped.amount) / 1e6;
        await updateWalletOperation(getSupabase(), operation.id, { status: 'confirmed', result: { amountUsd }, reconciled_at: new Date().toISOString() });
        return Response.json({ status: 'converted', amountUsd, errorMessage: null });
      } catch (error) {
        await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
        console.error('[wallet/convert-to-collateral] wrap outcome requires backend reconciliation:', error);
        return Response.json({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your conversion is being verified. Check your trading balance before trying again.' }, { status: 202 });
      }
    };

    if (nativeBalance <= BigInt(0)) {
      return wrapDeposit();
    }

    const swapOperation = await beginWalletOperation(getSupabase(), {
      userId: viewer.id,
      type: 'deposit_swap',
      request: { walletId: wallet.id, nativeBalance: nativeBalance.toString(), depositAddress },
      idempotencyKey: request.headers.get('idempotency-key'),
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
          return Response.json({ status: 'failed', amountUsd: 0, errorMessage: 'The conversion failed. Check your trading balance before starting another conversion.' });
        } else {
          return Response.json({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your conversion is still processing. Check your trading balance before trying again.' }, { status: 202 });
        }
      } catch (error) {
        console.warn('[wallet/convert-to-collateral] existing swap action lookup failed:', error);
        return Response.json({ status: 'reconciliation_required', amountUsd: 0, errorMessage: 'Your conversion is being verified. Check your trading balance before trying again.' }, { status: 202 });
      }
    }
    if (!swapOperation.started && !swapOperation.operation.provider_action_id && swapOperation.operation.status !== 'pending') {
      return Response.json({ status: 'pending', amountUsd: 0, errorMessage: 'Your previous conversion is being reconciled. Check your trading balance before trying again.' }, { status: 202 });
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
          return Response.json({ status: 'failed', amountUsd: 0, errorMessage: 'The conversion failed. Check your trading balance before starting another conversion.' });
        }
        if (result.status !== 'succeeded') {
          return Response.json({ status: 'pending', amountUsd: 0, errorMessage: 'Your conversion is still processing. Check your trading balance before trying again.' }, { status: 202 });
        }
      } catch (error) {
        await updateWalletOperation(getSupabase(), swapOperation.operation.id, { status: 'reconciliation_required' });
        console.error('[wallet/convert-to-collateral] swap outcome requires backend reconciliation:', error);
        return Response.json({ status: 'pending', amountUsd: 0, errorMessage: 'Your conversion is being verified. Check your trading balance before trying again.' }, { status: 202 });
      }
    }
    return wrapDeposit();
  });
}
