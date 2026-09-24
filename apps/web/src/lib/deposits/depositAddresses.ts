import { createHmac, timingSafeEqual } from 'node:crypto';
import { createPublicClient, http, erc20Abi } from 'viem';
import { polygon } from 'viem/chains';
import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { getOrCreateUser, getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser } from '@/lib/trading/client';
import { POLYGON_USDC_E, POLYGON_USDC_NATIVE } from '@/features/wallet/lib/walletService';

const ALCHEMY_UPDATE_ADDRESSES_URL = 'https://dashboard.alchemy.com/api/update-webhook-addresses';

export interface CryptoDepositInfo {
  network: 'polygon';
  /** Native USDC goes to the user's embedded wallet (it's swapped on arrival). */
  usdc: { address: string; balance: number };
  /** USDC.e goes straight to the Polymarket Deposit Wallet (wrapped on arrival). */
  usdcE: { address: string; balance: number };
  /** Whether arrivals convert in the background (Alchemy webhook set up)
   * or only when the app checks. */
  autoConvert: boolean;
}

export function isAlchemyWebhookConfigured(): boolean {
  return Boolean(env.alchemyWebhookId && env.alchemyNotifyAuthToken && env.alchemyWebhookSigningKey);
}

/**
 * Everything the crypto deposit screen needs: where to send each token,
 * and what has already landed there. Also records both addresses as this
 * user's (and adds them to the Alchemy webhook) so a deposit that arrives
 * while the app is closed still converts. That bookkeeping is best-effort:
 * a missing table or an Alchemy outage must never hide the addresses.
 */
export async function getCryptoDepositInfo(privyUserId: string): Promise<CryptoDepositInfo | null> {
  const wallet = await getPrimaryEthereumWallet(privyUserId);
  if (!wallet) return null;

  // Resolves (and deploys, if needed) the Polymarket Deposit Wallet.
  const client = await buildSecureClientForUser(wallet.id);
  const embedded = wallet.address.toLowerCase();
  const depositWallet = client.account.wallet.toLowerCase();

  const publicClient = createPublicClient({ chain: polygon, transport: http(env.polygonRpcUrl) });
  const [usdcRaw, usdcERaw] = await Promise.all([
    publicClient.readContract({
      address: POLYGON_USDC_NATIVE,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [embedded as `0x${string}`],
    }),
    publicClient.readContract({
      address: POLYGON_USDC_E,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [depositWallet as `0x${string}`],
    }),
  ]);

  await rememberDepositAddresses(privyUserId, [
    { address: embedded, kind: 'embedded' },
    { address: depositWallet, kind: 'deposit_wallet' },
  ]).catch((error) => console.warn('[deposits] could not record deposit addresses:', error));

  return {
    network: 'polygon',
    usdc: { address: wallet.address, balance: Number(usdcRaw) / 1e6 },
    usdcE: { address: client.account.wallet, balance: Number(usdcERaw) / 1e6 },
    autoConvert: isAlchemyWebhookConfigured(),
  };
}

async function rememberDepositAddresses(
  privyUserId: string,
  addresses: { address: string; kind: 'embedded' | 'deposit_wallet' }[]
): Promise<void> {
  const supabase = getSupabase();
  const user = await getOrCreateUser(privyUserId);

  const { data: known, error: readError } = await supabase
    .from('deposit_addresses')
    .select('address, webhook_registered_at')
    .in(
      'address',
      addresses.map((entry) => entry.address)
    );
  if (readError) throw readError;

  const registered = new Set(
    (known ?? []).filter((row) => row.webhook_registered_at).map((row) => row.address as string)
  );
  const missing = addresses.filter((entry) => !(known ?? []).some((row) => row.address === entry.address));
  if (missing.length > 0) {
    const { error } = await supabase.from('deposit_addresses').upsert(
      missing.map((entry) => ({
        address: entry.address,
        kind: entry.kind,
        user_id: user.id,
        privy_user_id: privyUserId,
      })),
      { onConflict: 'address', ignoreDuplicates: true }
    );
    if (error) throw error;
  }

  const toRegister = addresses.map((entry) => entry.address).filter((address) => !registered.has(address));
  if (toRegister.length === 0 || !isAlchemyWebhookConfigured()) return;

  await addAddressesToAlchemyWebhook(toRegister);
  const { error } = await supabase
    .from('deposit_addresses')
    .update({ webhook_registered_at: new Date().toISOString() })
    .in('address', toRegister);
  if (error) throw error;
}

async function addAddressesToAlchemyWebhook(addresses: string[]): Promise<void> {
  const response = await fetch(ALCHEMY_UPDATE_ADDRESSES_URL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Alchemy-Token': env.alchemyNotifyAuthToken ?? '',
    },
    body: JSON.stringify({
      webhook_id: env.alchemyWebhookId,
      addresses_to_add: addresses,
      addresses_to_remove: [],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Alchemy update-webhook-addresses failed: ${response.status} ${detail.slice(0, 200)}`);
  }
}

/** `X-Alchemy-Signature` is a hex HMAC-SHA256 of the raw body, keyed by
 * the webhook's signing key. */
export function isValidAlchemySignature(rawBody: string, signature: string | null): boolean {
  const key = env.alchemyWebhookSigningKey;
  if (!key || !signature) return false;
  const expected = createHmac('sha256', key).update(rawBody, 'utf8').digest('hex');
  const given = signature.trim().toLowerCase();
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Owners (Privy user ids) of the given deposit addresses. */
export async function findDepositOwners(addresses: string[]): Promise<Map<string, string>> {
  const owners = new Map<string, string>();
  if (addresses.length === 0) return owners;
  const { data, error } = await getSupabase()
    .from('deposit_addresses')
    .select('address, privy_user_id')
    .in(
      'address',
      addresses.map((address) => address.toLowerCase())
    );
  if (error) throw error;
  for (const row of data ?? []) owners.set(row.address as string, row.privy_user_id as string);
  return owners;
}

export const DEPOSIT_TOKEN_CONTRACTS = new Set([POLYGON_USDC_NATIVE.toLowerCase(), POLYGON_USDC_E.toLowerCase()]);
