import { createPublicClient, encodeFunctionData, erc20Abi, http } from 'viem';
import { polygon } from 'viem/chains';
import { env } from '@/lib/env';
import { getPrivyClient } from '@/lib/privyClient';
import { getSupabase } from '@/lib/supabase';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { getDepositWalletAddress } from '@/lib/trading/depositWallet';
import { getBridgeAssets, getBridgeDepositAddresses } from '@/lib/deposits/polymarketBridge';
import { beginWalletOperation, updateWalletOperation } from '@/lib/walletOperations';

/** What card purchases buy: native USDC on Polygon (what MoonPay/Stripe sell). */
export const CARD_DEPOSIT_CHAIN_ID = '137';
export const CARD_DEPOSIT_TOKEN = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const;

/** Whether card deposits are switched on. Forwarding the purchase from the
 * embedded wallet to the bridge is an on-chain transfer that needs gas, so
 * this stays off until Privy gas sponsorship is enabled for Polygon. One
 * flag for the web UI and the backend. */
export function isCardDepositEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CARD_DEPOSIT_ENABLED === 'true';
}

const rpc = () => createPublicClient({ chain: polygon, transport: http(env.polygonRpcUrl) });

async function embeddedUsdc(address: string): Promise<bigint> {
  return rpc().readContract({
    address: CARD_DEPOSIT_TOKEN,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });
}

/** The embedded wallet a card purchase lands in, and the USDC waiting there. */
export async function getCardDepositState(privyUserId: string) {
  const wallet = await getPrimaryEthereumWallet(privyUserId);
  if (!wallet) return null;
  return { address: wallet.address, usdcBalance: Number(await embeddedUsdc(wallet.address)) / 1e6 };
}

export interface ForwardResult {
  status: 'forwarded' | 'nothing';
  amountUsd: number;
  transactionHash: string | null;
}

/**
 * Card deposit step 2: sends the native USDC a card purchase delivered to
 * the embedded wallet to the user's bridge deposit address for that chain
 * (Polygon USDC → the `evm` address, per `/supported-assets`). The bridge
 * then delivers pUSD to the Deposit Wallet. The transfer is signed by the
 * delegated backend key with Privy-sponsored gas, and recorded in the
 * `wallet_operations` ledger (`deposit_forward`) so it can't run twice.
 */
export async function forwardCardDeposit(params: {
  userId: string;
  privyUserId: string;
  idempotencyKey: string | null;
}): Promise<ForwardResult> {
  const wallet = await getPrimaryEthereumWallet(params.privyUserId);
  const depositWallet = await getDepositWalletAddress(params.userId, params.privyUserId);
  if (!wallet || !depositWallet) return { status: 'nothing', amountUsd: 0, transactionHash: null };

  const balance = await embeddedUsdc(wallet.address);
  const asset = (await getBridgeAssets()).find(
    (candidate) => candidate.chainId === CARD_DEPOSIT_CHAIN_ID && candidate.tokenAddress.toLowerCase() === CARD_DEPOSIT_TOKEN.toLowerCase()
  );
  const amountUsd = Number(balance) / 1e6;
  // Below the bridge's minimum it would not be processed  leave it.
  if (!asset || amountUsd < asset.minUsd) return { status: 'nothing', amountUsd, transactionHash: null };

  const to = (await getBridgeDepositAddresses(depositWallet))[asset.addressType];
  if (!to) return { status: 'nothing', amountUsd, transactionHash: null };

  const { operation, started } = await beginWalletOperation(getSupabase(), {
    userId: params.userId,
    type: 'deposit_forward',
    request: { walletId: wallet.id, amount: balance.toString(), to },
    idempotencyKey: params.idempotencyKey,
  });
  if (!started) return { status: 'forwarded', amountUsd, transactionHash: operation.transaction_hash ?? null };

  try {
    const sent = await getPrivyClient()
      .wallets()
      .ethereum()
      .sendTransaction(wallet.id, {
        caip2: `eip155:${CARD_DEPOSIT_CHAIN_ID}`,
        params: {
          transaction: {
            to: CARD_DEPOSIT_TOKEN,
            data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to as `0x${string}`, balance] }),
            chain_id: Number(CARD_DEPOSIT_CHAIN_ID),
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
      result: { amountUsd },
      reconciled_at: new Date().toISOString(),
    });
    return { status: 'forwarded', amountUsd, transactionHash: sent.hash };
  } catch (error) {
    await updateWalletOperation(getSupabase(), operation.id, { status: 'reconciliation_required' });
    throw error;
  }
}
