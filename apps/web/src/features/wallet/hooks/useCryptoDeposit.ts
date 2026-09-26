'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCryptoDepositInfo, type BridgeTransaction } from '@/features/wallet/lib/walletService';

const POLL_MS = 10_000;
/** Bridge transfers older than this aren't "the deposit you just sent". */
const RECENT_MS = 60 * 60 * 1000;
/** A deposit that completed this recently is shown as "added". */
const JUST_COMPLETED_MS = 10 * 60 * 1000;
const IN_FLIGHT = new Set(['DEPOSIT_DETECTED', 'PROCESSING', 'ORIGIN_TX_CONFIRMED', 'SUBMITTED']);

export type CryptoDepositStatus = 'loading' | 'error' | 'waiting' | 'bridging' | 'completed' | 'failed';

/**
 * Crypto deposit sheet state  same behavior as the mobile hook. While
 * `active`, re-reads the bridge addresses, supported assets and transfer
 * status every 10s. The bridge delivers pUSD itself, so there is nothing to
 * convert: a completed transfer just refreshes the balance.
 */
export function useCryptoDeposit(active: boolean) {
  const queryClient = useQueryClient();
  const info = useQuery({
    queryKey: ['crypto-deposit'],
    queryFn: getCryptoDepositInfo,
    enabled: active,
    refetchInterval: active ? POLL_MS : false,
    staleTime: 0,
  });

  const latest = latestTransfer(info.data?.transactions ?? [], info.dataUpdatedAt);
  const completedAt =
    latest?.status === 'COMPLETED' && latest.createdAtMs != null && info.dataUpdatedAt - latest.createdAtMs <= JUST_COMPLETED_MS
      ? latest.createdAtMs
      : null;

  useEffect(() => {
    if (completedAt == null) return;
    void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    void queryClient.invalidateQueries({ queryKey: ['positions'] });
  }, [completedAt, queryClient]);

  let status: CryptoDepositStatus;
  if (latest && IN_FLIGHT.has(latest.status)) status = 'bridging';
  else if (latest?.status === 'FAILED') status = 'failed';
  else if (completedAt != null) status = 'completed';
  else if (info.isPending) status = 'loading';
  else if (info.isError || info.data?.unavailable) status = 'error';
  else status = 'waiting';

  return {
    info: info.data?.unavailable ? null : (info.data ?? null),
    status,
    checkNow: () => void info.refetch(),
    isChecking: info.isFetching,
  };
}

function latestTransfer(transactions: BridgeTransaction[], fetchedAt: number): BridgeTransaction | null {
  const latest = transactions[0];
  if (!latest) return null;
  if (latest.createdAtMs != null && fetchedAt - latest.createdAtMs > RECENT_MS) return null;
  return latest;
}
