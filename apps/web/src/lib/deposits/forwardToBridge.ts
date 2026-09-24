import { createPublicClient, encodeFunctionData, erc20Abi, http } from 'viem';
import { polygon } from 'viem/chains';
import { env } from '@/lib/env';
import { getPrivyClient } from '@/lib/privyClient';
import { getSupabase } from '@/lib/supabase';
import { POLYGON_CAIP2, POLYGON_USDC_NATIVE } from '@/features/wallet/lib/walletService';
import { getBridgeDepositAddresses } from '@/lib/deposits/polymarketBridge';
import { beginWalletOperation, updateWalletOperation } from '@/lib/walletOperations';

/** Whether card deposits are switched on. The card flow lands native USDC
 * in the embedded wallet, and forwarding it to the bridge is an on-chain
 * transfer that needs gas — so this must only be turned on once Privy gas
 * sponsorship is enabled for Polygon (Dashboard → Fee sponsorship). One
 * flag for the web UI and the backend, like `NEXT_PUBLIC_TRADING_ENABLED`. */
export function isCardDepositEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CARD_DEPOSIT_ENABLED === 'true';
}

export interface ForwardResult {
  amountUsd: number;
  transactionHash: string | null;
}

/**
 * Card deposit step 2: moves the native USDC a card purchase delivered to
 * the user's embedded wallet on to their Polymarket bridge address, which
 * turns it into USDC.e in the Deposit Wallet. Sent as an ERC-20 transfer
 * from the embedded wallet, signed by the delegated backend key, with gas
 * paid by Privy gas sponsorship (`sponsor: true`).
 *
 * Returns `null` when there's nothing to forward. Recorded in the
 * `wallet_operations` ledger (as a `deposit_forward`) so the webhook and
 * the app can't send the same funds twice.
 */
export async function forwardEmbeddedUsdcToBridge(params: {
  userId: string;
  walletId: string;
  embeddedAddress: string;
  depositWalletAddress: string;
  idempotencyKey: string | null;
}): Promise<ForwardResult | null> {
  const publicClient = createPublicClient({ chain: polygon, transport: http(env.polygonRpcUrl) });
  const balance = await publicClient.readContract({
    address: POLYGON_USDC_NATIVE,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [params.embeddedAddress as `0x${string}`],
  });
  if (balance <= BigInt(0)) return null;

  const bridge = await getBridgeDepositAddresses(params.depositWalletAddress);
  const { operation, started } = await beginWalletOperation(getSupabase(), {
    userId: params.userId,
    type: 'deposit_forward',
    request: { kind: 'bridge_forward', walletId: params.walletId, amount: balance.toString(), to: bridge.evm },
    idempotencyKey: params.idempotencyKey,
  });
  // Another request is already forwarding these funds.
  if (!started) return { amountUsd: Number(balance) / 1e6, transactionHash: operation.transaction_hash ?? null };

  try {
    const sent = await getPrivyClient()
      .wallets()
      .ethereum()
      .sendTransaction(params.walletId, {
        caip2: POLYGON_CAIP2,
        params: {
          transaction: {
            to: POLYGON_USDC_NATIVE,
            data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [bridge.evm as `0x${string}`, balance] }),
            chain_id: 137,
          },
        },
        sponsor: true,
        authorization_context: { authorization_private_keys: [env.privyAuthorizationPrivateKey!] },
        idempotency_key: operation.id,
      });
    await updateWalletOperation(getSupabase(), operation.id, {
      status: 'confirmed',
      transaction_hash: sent.hash,
      transaction_id: sent.transaction_id ?? null,
      result: { amountUsd: Number(balance) / 1e6 },
      reconciled_at: new Date().toISOString(),
    });
    return { amountUsd: Number(balance) / 1e6, transactionHash: sent.hash };
  } catch (error) {
    await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
    throw error;
  }
}
