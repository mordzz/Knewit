'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '@/lib/apiClient';
import {
  convertToCollateral,
  getCryptoDepositInfo,
  type ConvertToCollateralResult,
} from '@/features/wallet/lib/walletService';

/** Below this, USDC.e in the Deposit Wallet is dust — not worth a wrap. */
const MIN_CONVERTIBLE_USDC = 0.01;
const POLL_MS = 10_000;
/** Bridge transactions older than this aren't "the deposit you just sent". */
const RECENT_BRIDGE_MS = 60 * 60 * 1000;
const BRIDGE_IN_FLIGHT = new Set(['DEPOSIT_DETECTED', 'PROCESSING', 'ORIGIN_TX_CONFIRMED', 'SUBMITTED']);

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
 * Crypto deposit modal state — same behavior as the mobile hook: while
 * `active`, re-reads the deposit info every 10s (bridge status + USDC.e in
 * the Deposit Wallet) and wraps arrived USDC.e into pUSD once per arrival.
 */
export function useCryptoDeposit(active: boolean) {
  const queryClient = useQueryClient();
  const attemptedFor = useRef<string | null>(null);

  const info = useQuery({
    queryKey: ['crypto-deposit'],
    queryFn: getCryptoDepositInfo,
    enabled: active,
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

  const latest = info.data?.bridge?.transactions[0] ?? null;
  // Measured against when the data was fetched, not the render clock.
  const recent =
    latest && (latest.createdAtMs == null || info.dataUpdatedAt - latest.createdAtMs <= RECENT_BRIDGE_MS)
      ? latest
      : null;

  let status: CryptoDepositStatus;
  let message: string | null = null;
  if (convert.isPending) status = 'converting';
  else if (convert.data?.status === 'converted') status = 'converted';
  else if (convert.isError || convert.data) {
    status = 'processing';
    message =
      convert.data?.errorMessage ??
      (convert.error instanceof ApiRequestError
        ? convert.error.body.message
        : "We couldn't convert your deposit yet. Your funds are safe — use Check now.");
  } else if (recent && BRIDGE_IN_FLIGHT.has(recent.status)) status = 'bridging';
  else if (recent?.status === 'FAILED') status = 'bridge_failed';
  else if (info.isPending) status = 'loading';
  else if (info.isError || info.data?.unavailable) status = 'error';
  else status = 'waiting';

  return {
    info: info.data?.unavailable ? null : (info.data ?? null),
    status,
    message,
    convertedAmount: convert.data?.status === 'converted' ? convert.data.amountUsd : null,
    checkNow,
    isChecking: info.isFetching,
  };
}
