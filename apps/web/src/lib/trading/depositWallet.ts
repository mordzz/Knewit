import { getSupabase } from '@/lib/supabase';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { buildSecureClientForUser } from '@/lib/trading/client';

/**
 * The user's Polymarket Deposit Wallet address  where trading funds live
 * and what the bridge delivers pUSD to. Resolved once through the secure
 * client (which also deploys the wallet if needed) and kept on the user row
 * (`users.deposit_wallet_address`) so later reads skip the signing client.
 */
export async function getDepositWalletAddress(userId: string, privyUserId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase.from('users').select('deposit_wallet_address').eq('id', userId).maybeSingle();
  if (data?.deposit_wallet_address) return data.deposit_wallet_address as string;

  const wallet = await getPrimaryEthereumWallet(privyUserId);
  if (!wallet) return null;
  const client = await buildSecureClientForUser(wallet.id);
  const address = client.account.wallet.toLowerCase();
  const { error } = await supabase.from('users').update({ deposit_wallet_address: address }).eq('id', userId);
  if (error) console.warn('[deposit-wallet] could not remember the address:', error);
  return address;
}
