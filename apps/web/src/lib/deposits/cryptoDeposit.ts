import { getDepositWalletAddress } from '@/lib/trading/depositWallet';
import {
  getBridgeAssets,
  getBridgeDepositAddresses,
  getBridgeTransactions,
  type BridgeAsset,
  type BridgeDepositAddresses,
  type BridgeTransaction,
} from '@/lib/deposits/polymarketBridge';

export interface CryptoDepositInfo {
  /** The user's bridge deposit address per address type  whatever is
   * sent there (any supported token/chain) arrives as pUSD in the Deposit
   * Wallet, ready to trade. */
  addresses: BridgeDepositAddresses;
  /** Every token/chain the bridge accepts, with its minimum. */
  assets: BridgeAsset[];
  /** Recent transfers into those addresses, newest first. */
  transactions: BridgeTransaction[];
}

/**
 * Everything the crypto deposit screen needs, straight from the Polymarket
 * bridge (docs.polymarket.com/trading/bridge): `/deposit` for the
 * addresses, `/supported-assets` for the token and chain pickers, and
 * `/status` for what's on its way. No wrapping, webhooks or RPC  the
 * bridge delivers pUSD itself.
 */
export async function getCryptoDepositInfo(userId: string, privyUserId: string): Promise<CryptoDepositInfo | null> {
  const depositWallet = await getDepositWalletAddress(userId, privyUserId);
  if (!depositWallet) return null;

  const [addresses, assets] = await Promise.all([getBridgeDepositAddresses(depositWallet), getBridgeAssets()]);
  const sources = [addresses.evm, addresses.svm, addresses.btc, addresses.tron].filter(
    (address): address is string => Boolean(address)
  );
  const results = await Promise.all(sources.map((address) => getBridgeTransactions(address).catch(() => [])));
  const transactions = results.flat().sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
  return { addresses, assets, transactions };
}
