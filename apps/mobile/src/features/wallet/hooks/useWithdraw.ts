import { useQueryClient } from '@tanstack/react-query';
import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import { useWallet } from '@/hooks/useWallet';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { POLYGON_USDC_E } from '@/features/wallet/services/walletService';

function encodeTransfer(recipient: string, amount: bigint) {
  const address = recipient.slice(2).toLowerCase().padStart(64, '0');
  const value = amount.toString(16).padStart(64, '0');
  return `0xa9059cbb${address}${value}`;
}

export function useWithdraw() {
  const { address } = useWallet();
  const { wallets } = useEmbeddedEthereumWallet();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();

  const withdraw = async (recipient: string, amount: string) => {
    if (!address || wallets.length === 0) throw new Error('Connect a wallet before withdrawing.');
    const value = BigInt(Math.round(Number(amount) * 1_000_000));
    if (value <= 0n) throw new Error('Enter a withdrawal amount greater than zero.');
    if (balance.data?.usdc != null && Number(amount) > balance.data.usdc)
      throw new Error('The withdrawal amount exceeds your available balance.');
    const provider = await wallets[0].getProvider();
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: address,
          to: POLYGON_USDC_E,
          data: encodeTransfer(recipient, value),
          value: '0x0',
          chainId: '0x89',
        },
      ],
    });
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    return String(hash);
  };

  return { withdraw };
}
