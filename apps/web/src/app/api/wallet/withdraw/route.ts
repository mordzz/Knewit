import { AssetType } from '@polymarket/bindings/clob';
import { TransactionFailedError, type TransactionHandle } from '@polymarket/client';
import { fetchBalanceAllowance } from '@polymarket/client/actions';
import { isAddress, parseUnits } from 'viem';
import { ApiError, badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser, signerForUserWallet } from '@/lib/trading/client';
import { unwrapPusdToUsdcE } from '@/lib/trading/collateral';
import { env } from '@/lib/env';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
import { beginWalletOperation, updateWalletOperation } from '@/lib/walletOperations';
import { reconcileUserWalletOperations } from '@/lib/walletReconciliation';

export const maxDuration = 60;

interface WithdrawInput {
  recipient: string;
  amount: string;
}

/**
 * Unwraps pUSD and sends the resulting USDC.e to the chosen external address.
 * The secure Polymarket client uses the user's delegated Privy signer and
 * Builder credentials; the embedded EOA is not the source of trading funds.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    if (process.env.NEXT_PUBLIC_TRADING_ENABLED !== 'true') {
      throw new ApiError(503, 'trading_unavailable', 'Withdrawals are temporarily unavailable.');
    }
    if (!env.privyAuthorizationPrivateKey) {
      throw new ApiError(503, 'authorization_key_missing', 'Withdrawals are not configured yet.');
    }

    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    await reconcileUserWalletOperations(viewer.id).catch((error) => console.warn('[wallet/withdraw] prior operation reconciliation incomplete:', error));
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) throw badRequest('No embedded wallet found for this account.');

    const body = (await request.json().catch(() => null)) as Partial<WithdrawInput> | null;
    if (!body || typeof body.recipient !== 'string' || typeof body.amount !== 'string') {
      throw badRequest('Expected a recipient address and USDC amount.');
    }

    const recipient = body.recipient.trim();
    const amountText = body.amount.trim();
    // viem's default mode accepts any correctly-sized hex string. `strict`
    // also verifies EIP-55 when the address uses mixed case, catching typos.
    if (!isAddress(recipient, { strict: true })) {
      throw badRequest('Enter a valid Polygon wallet address. Check the address and its checksum.');
    }
    if (/^0x0{40}$/i.test(recipient)) throw badRequest('The zero address cannot receive a withdrawal.');
    if (!/^\d+(?:\.\d{1,6})?$/.test(amountText)) {
      throw badRequest('Enter a valid USDC amount with up to 6 decimal places.');
    }

    const amount = parseUnits(amountText, 6);
    if (amount <= BigInt(0)) throw badRequest('Enter a withdrawal amount greater than zero.');

    const client = await buildSecureClientForUser(wallet.id);
    if (recipient.toLowerCase() === client.account.wallet.toLowerCase()) {
      throw badRequest('Choose a destination other than your trading wallet.');
    }

    let available: bigint;
    try {
      const balance = await fetchBalanceAllowance(client, { assetType: AssetType.COLLATERAL });
      available = BigInt(String(balance.balance));
    } catch (error) {
      console.error('[wallet/withdraw] trading balance check failed:', error);
      throw new ApiError(502, 'balance_unavailable', 'Could not verify your trading balance. Please try again.');
    }

    if (amount > available) {
      throw new ApiError(400, 'insufficient_balance', 'The withdrawal amount exceeds your available trading balance.');
    }

    const operationRequest = { walletId: wallet.id, recipient: recipient.toLowerCase(), amount: amount.toString() };
    const { operation, started } = await beginWalletOperation(getSupabase(), {
      userId: viewer.id,
      type: 'withdraw',
      request: operationRequest,
      idempotencyKey: request.headers.get('idempotency-key'),
    });
    if (!started) {
      if (operation.status === 'confirmed' && operation.result) {
        return Response.json(operation.result);
      }
      throw new ApiError(409, 'withdrawal_in_progress', 'This withdrawal is already being processed. Check the destination wallet and your trading balance before trying again.');
    }

    let handle: TransactionHandle;
    try {
      handle = await unwrapPusdToUsdcE(client, signerForUserWallet(wallet.id), recipient as `0x${string}`, amount);
    } catch (error) {
      await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
      console.error('[wallet/withdraw] transfer submission failed:', error);
      return Response.json({ code: 'withdrawal_pending_review', message: 'The withdrawal result is being checked. Verify your trading balance and destination before submitting another withdrawal.', status: 'reconciliation_required' }, { status: 202 });
    }

    await updateWalletOperation(getSupabase(), operation.id, {
      status: 'submitted',
      transaction_hash: handle.transactionHash,
      transaction_id: handle.transactionId,
    });

    try {
      const outcome = await handle.wait();
      const result = {
        status: 'confirmed',
        amountUsdc: Number(amount) / 1e6,
        transactionHash: outcome.transactionHash,
        transactionId: outcome.transactionId,
      };
      await updateWalletOperation(getSupabase(), operation.id, { status: 'confirmed', result, reconciled_at: new Date().toISOString() });
      return Response.json(result);
    } catch (error) {
      if (error instanceof TransactionFailedError) {
        await updateWalletOperation(getSupabase(), operation.id, { status: 'failed', error_code: 'transaction_failed', reconciled_at: new Date().toISOString() });
        console.error('[wallet/withdraw] transaction failed:', error);
        throw new ApiError(502, 'withdrawal_failed', 'The withdrawal transaction failed on Polygon. Your trading balance was not withdrawn.');
      }

      // The relayer accepted the transaction, but its final status could not
      // be read before the request timed out. The ledger status stays
      // 'reconciliation_required' for the background reconciler, but the
      // response body uses `status: 'pending'` — matching `WithdrawResult`'s
      // type — because it carries a real transaction hash the client can
      // already show; `apiClient.ts` only intercepts and throws for the
      // literal string 'reconciliation_required', which would otherwise
      // discard the hash/id fields the UI needs to avoid telling the user to
      // submit a duplicate withdrawal.
      console.warn('[wallet/withdraw] transaction status is pending:', { transactionHash: handle.transactionHash, transactionId: handle.transactionId });
      await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
      return Response.json(
        {
          status: 'pending',
          amountUsdc: Number(amount) / 1e6,
          transactionHash: handle.transactionHash,
          transactionId: handle.transactionId,
        },
        { status: 202 }
      );
    }
  });
}
