import { prepareGaslessTransaction } from '@polymarket/client/actions';
import type { Signer } from '@polymarket/client';
import { createPublicClient, encodeFunctionData, erc20Abi, http, parseAbi } from 'viem';
import { polygon } from 'viem/chains';
import type { UserSecureClient } from '@/lib/trading/client';
import { env } from '@/lib/env';

export const POLYGON_USDC_E = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as const;
export const POLYMARKET_PUSD = '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB' as const;
export const COLLATERAL_ONRAMP = '0x93070a847efEf7F70739046A929D47a521F5B8ee' as const;
export const COLLATERAL_OFFRAMP = '0x2957922Eb93258b93368531d39fAcCA3B4dC5854' as const;

const publicClient = createPublicClient({ chain: polygon, transport: http(env.polygonRpcUrl) });
const onrampAbi = parseAbi(['function wrap(address _asset, address _to, uint256 _amount)']);
const offrampAbi = parseAbi(['function unwrap(address _asset, address _to, uint256 _amount)']);
const approveAbi = parseAbi(['function approve(address spender, uint256 amount) returns (bool)']);

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

/** Wrap all USDC.e already delivered to the user's Polymarket Deposit Wallet into trading collateral (pUSD). */
export async function wrapDepositWalletUsdcE(
  client: UserSecureClient,
  signer: Signer,
  onSubmitted?: (transaction: { transactionId: string | null; transactionHash: string | null; amount: string }) => Promise<void>
) {
  const wallet = client.account.wallet as `0x${string}`;
  const amount = await publicClient.readContract({
    address: POLYGON_USDC_E,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet],
  });
  if (amount === BigInt(0)) return { status: 'pending' as const, amount: BigInt(0) };
  const startingPusd = await publicClient.readContract({
    address: POLYMARKET_PUSD,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet],
  });

  const handle = await submitGaslessCalls(client, signer, [
    {
      to: POLYGON_USDC_E,
      data: encodeFunctionData({ abi: approveAbi, functionName: 'approve', args: [COLLATERAL_ONRAMP, amount] }),
    },
    {
      to: COLLATERAL_ONRAMP,
      data: encodeFunctionData({ abi: onrampAbi, functionName: 'wrap', args: [POLYGON_USDC_E, wallet, amount] }),
    },
  ], 'Wrap deposited USDC.e into Polymarket trading balance');
  await onSubmitted?.({ transactionId: handle.transactionId, transactionHash: handle.transactionHash, amount: amount.toString() });
  try {
    await handle.wait();
    return { status: 'wrapped' as const, amount };
  } catch (error) {
    // Relayer submission may have succeeded even when polling its final
    // status failed. Reconcile on-chain balances before deciding whether a
    // retry is safe or reporting that funds are still pending.
    const [remainingUsdcE, tradingPusd] = await Promise.all([
      publicClient.readContract({
        address: POLYGON_USDC_E,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [wallet],
      }),
      publicClient.readContract({
        address: POLYMARKET_PUSD,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [wallet],
      }),
    ]);
    const consumedUsdcE = amount - remainingUsdcE;
    const receivedPusd = tradingPusd - startingPusd;
    if (consumedUsdcE > BigInt(0) && receivedPusd >= consumedUsdcE) {
      return { status: 'wrapped' as const, amount: receivedPusd };
    }
    console.warn('[wallet] wrap outcome is unresolved; on-chain funds still require reconciliation', error);
    throw new Error('Wrap transaction status is unresolved. Check your trading balance before retrying.');
  }
}

/** Unwrap the requested pUSD directly to the user's external withdrawal address as USDC.e. */
export async function unwrapPusdToUsdcE(
  client: UserSecureClient,
  signer: Signer,
  recipient: `0x${string}`,
  amount: bigint,
) {
  return submitGaslessCalls(client, signer, [
    {
      to: POLYMARKET_PUSD,
      data: encodeFunctionData({ abi: approveAbi, functionName: 'approve', args: [COLLATERAL_OFFRAMP, amount] }),
    },
    {
      to: COLLATERAL_OFFRAMP,
      data: encodeFunctionData({ abi: offrampAbi, functionName: 'unwrap', args: [POLYGON_USDC_E, recipient, amount] }),
    },
  ], 'Withdraw Polymarket trading balance as USDC.e');
}
