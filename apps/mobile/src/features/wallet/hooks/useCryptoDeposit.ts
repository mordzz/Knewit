import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/expo';
import {
  convertToCollateral,
  getCryptoDepositInfo,
  type BridgeTransaction,
  type ConvertToCollateralResult,
} from '@/features/wallet/services/walletService';
import { ApiRequestError } from '@/services/api/client';

/** Below this, USDC.e in the Deposit Wallet is dust — not worth a wrap. */
const MIN_CONVERTIBLE_USDC = 0.01;
const POLL_MS = 10_000;
/** Bridge transactions older than this aren't "the deposit you just sent". */
const RECENT_BRIDGE_MS = 60 * 60 * 1000;
const BRIDGE_IN_FLIGHT = new Set([
  'DEPOSIT_DETECTED',
  'PROCESSING',
  'ORIGIN_TX_CONFIRMED',
  'SUBMITTED',
]);

export type CryptoDepositStatus =
  | 'loading'
  | 'error'
  | 'waiting'
  | 'bridging'
  | 'bridge_failed'
  | 'converting'
  | 'converted'
  | 'processing';

/**
 * Crypto deposit screen state. While `active`, it re-reads the deposit
 * info every 10s: the Polymarket bridge's own status for anything sent
 * to the bridge addresses, and the USDC.e balance of the Deposit Wallet
 * (where bridged funds, or USDC.e sent directly, land). As soon as USDC.e
 * is there it asks the backend to wrap it into pUSD (the same conversion
 * the card flow and the Alchemy webhook use, so it can't run twice).
 * Each arrival is attempted once automatically; `checkNow` retries.
 */
export function useCryptoDeposit(active: boolean) {
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  const attemptedFor = useRef<string | null>(null);

  const info = useQuery({
    queryKey: ['crypto-deposit', user?.id ?? null],
    queryFn: getCryptoDepositInfo,
    enabled: active && Boolean(user),
    refetchInterval: active ? POLL_MS : false,
    staleTime: 0,
  });

  const convert = useMutation<ConvertToCollateralResult, unknown>({
    mutationFn: convertToCollateral,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['crypto-deposit'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });

  const usdcE = info.data?.usdcE.balance ?? 0;
  const arrivalKey = usdcE >= MIN_CONVERTIBLE_USDC ? String(usdcE) : null;

  useEffect(() => {
    if (!active || !arrivalKey || convert.isPending) return;
    if (attemptedFor.current === arrivalKey) return;
    attemptedFor.current = arrivalKey;
    convert.mutate();
  }, [active, arrivalKey, convert]);

  const checkNow = () => {
    attemptedFor.current = null;
    void info.refetch();
  };

  const latestBridge = recentBridgeTransaction(
    info.data?.bridge?.transactions ?? [],
    info.dataUpdatedAt
  );

  let status: CryptoDepositStatus;
  let message: string | null = null;
  if (convert.isPending) {
    status = 'converting';
  } else if (convert.data?.status === 'converted') {
    status = 'converted';
  } else if (convert.isError || convert.data) {
    status = 'processing';
    message = convertMessage(convert.error, convert.data);
  } else if (latestBridge && BRIDGE_IN_FLIGHT.has(latestBridge.status)) {
    status = 'bridging';
  } else if (latestBridge?.status === 'FAILED') {
    status = 'bridge_failed';
  } else if (info.isPending) {
    status = 'loading';
  } else if (info.isError || info.data?.unavailable) {
    status = 'error';
  } else {
    status = 'waiting';
  }

  return {
    info: info.data?.unavailable ? null : (info.data ?? null),
    status,
    message,
    convertedAmount: convert.data?.status === 'converted' ? convert.data.amountUsd : null,
    checkNow,
    isChecking: info.isFetching,
  };
}

function recentBridgeTransaction(
  transactions: BridgeTransaction[],
  fetchedAt: number
): BridgeTransaction | null {
  const latest = transactions[0];
  if (!latest) return null;
  if (latest.createdAtMs != null && fetchedAt - latest.createdAtMs > RECENT_BRIDGE_MS) return null;
  return latest;
}

function convertMessage(error: unknown, data: ConvertToCollateralResult | undefined): string {
  if (data?.errorMessage) return data.errorMessage;
  if (error instanceof ApiRequestError) return error.body.message;
  return "We couldn't convert your deposit yet. Your funds are safe — tap Check now.";
}
