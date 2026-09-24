import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/expo';
import {
  convertToCollateral,
  getCryptoDepositInfo,
  type ConvertToCollateralResult,
} from '@/features/wallet/services/walletService';
import { ApiRequestError } from '@/services/api/client';

/** Below this, an arrival is dust — not worth a swap/wrap round trip. */
const MIN_CONVERTIBLE_USDC = 0.01;
const POLL_MS = 10_000;

export type CryptoDepositStatus =
  'loading' | 'error' | 'waiting' | 'converting' | 'converted' | 'processing';

/**
 * Crypto deposit screen state. While `active` (the screen is open), it
 * re-reads the deposit addresses' balances every 10s and, as soon as USDC
 * or USDC.e has arrived, asks the backend to convert it into trading
 * balance (`POST /wallet/convert-to-collateral` — the same conversion the
 * card flow and the Alchemy webhook use, so an arrival can't be
 * converted twice). Each arrival is attempted once automatically;
 * `checkNow` re-reads and retries on demand.
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

  const usdc = info.data?.usdc.balance ?? 0;
  const usdcE = info.data?.usdcE.balance ?? 0;
  const arrived = usdc >= MIN_CONVERTIBLE_USDC || usdcE >= MIN_CONVERTIBLE_USDC;
  const arrivalKey = arrived ? `${usdc}:${usdcE}` : null;

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

  let status: CryptoDepositStatus;
  let message: string | null = null;
  if (convert.isPending) {
    status = 'converting';
  } else if (convert.data?.status === 'converted') {
    status = 'converted';
  } else if (convert.isError || convert.data) {
    status = 'processing';
    message = convertMessage(convert.error, convert.data);
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

function convertMessage(error: unknown, data: ConvertToCollateralResult | undefined): string {
  if (data?.errorMessage) return data.errorMessage;
  if (error instanceof ApiRequestError) return error.body.message;
  return "We couldn't convert your deposit yet. Your funds are safe in your wallet — tap Check again.";
}
