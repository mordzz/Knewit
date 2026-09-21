'use client';

import { useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData, parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useSession } from '@/hooks/useSession';
import { POLYGON_CAIP2, POLYGON_USDC_E } from '@/features/wallet/lib/walletService';

const erc20Abi = [{
  name: 'transfer', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

export function useWithdraw() {
  const { address, isGuest } = useSession();
  const { sendTransaction } = useSendTransaction();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();

  const withdraw = async (recipient: `0x${string}`, amount: string) => {
    if (isGuest) throw new Error('Withdraw is unavailable in guest mode.');
    if (!address) throw new Error('Connect a wallet before withdrawing.');
    const value = parseUnits(amount, 6);
    if (value <= BigInt(0)) throw new Error('Enter a withdrawal amount greater than zero.');
    if (balance.data?.usdc != null && Number(amount) > balance.data.usdc) {
      throw new Error('The withdrawal amount exceeds your available balance.');
    }

    const result = await sendTransaction(
      {
        to: POLYGON_USDC_E,
        chainId: 137,
        data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [recipient, value] }),
        value: BigInt(0),
      },
      { address, uiOptions: { showWalletUIs: true }, sponsor: false }
    );
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    return result.hash;
  };

  return { withdraw, canWithdraw: Boolean(address) && !isGuest, chain: POLYGON_CAIP2 };
}
