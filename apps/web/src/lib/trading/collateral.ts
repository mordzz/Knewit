import { prepareGaslessTransaction } from '@polymarket/client/actions';
import type { Signer } from '@polymarket/client';
import { encodeFunctionData, erc20Abi } from 'viem';
import type { UserSecureClient } from '@/lib/trading/client';

/** Polymarket USD  the trading collateral held in the Deposit Wallet. */
export const POLYMARKET_PUSD = '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB' as const;

async function submitGaslessCalls(
  client: UserSecureClient,
  signer: Signer,
  calls: Array<{ to: `0x${string}`; data: `0x${string}` }>,
  metadata: string,
) {
  const workflow = await prepareGaslessTransaction(client, { calls, metadata });
  let step = await workflow.next();
  while (!step.done) {
    const request = step.value;
    const response = request.kind === 'requestAddress'
      ? await signer.getAddress()
      : request.kind === 'signGaslessMessage'
        ? await signer.signMessage(request.payload)
        : await signer.signTypedData(request.payload);
    step = await workflow.next(response);
  }
  return step.value;
}

/** Send pUSD from the Deposit Wallet to a Polymarket bridge withdrawal
 * address  the bridge takes pUSD directly and delivers the destination
 * token (docs.polymarket.com/trading/bridge/withdraw). */
export async function transferPusd(
  client: UserSecureClient,
  signer: Signer,
  to: `0x${string}`,
  amount: bigint,
) {
  return submitGaslessCalls(client, signer, [
    {
      to: POLYMARKET_PUSD,
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to, amount] }),
    },
  ], 'Withdraw Polymarket trading balance through the bridge');
}
