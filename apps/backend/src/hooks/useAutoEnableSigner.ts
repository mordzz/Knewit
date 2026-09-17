'use client';

import { useEffect, useRef } from 'react';
import { usePrivy, useSigners } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { publicEnv } from '@/lib/publicEnv';
import { useWalletBalance } from '@/hooks/useWalletBalance';

/**
 * Grants the backend's authorization key signing authority on the
 * viewer's embedded wallet, once per session, without a manual button:
 * `useSigners().addSigners` is Privy's documented owner-consent flow
 * (docs/WALLET.md, "Backend Signing"). Runs only when the balance read
 * proves the signer isn't attached yet (`usdc === null` on a successful
 * read) and a signer id is configured; the Wallet screen's button stays
 * as a manual retry if this attempt fails (e.g. the consent step was
 * dismissed).
 *
 * Guarded by a ref so React's dev-mode double-invoke and re-renders
 * can't fire it twice in a session; a failure is logged, never silently
 * treated as success.
 */
export function useAutoEnableSigner() {
  const { authenticated, user } = usePrivy();
  const { addSigners } = useSigners();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  const address = user?.wallet?.address ?? null;
  const signerId = publicEnv.privySignerId;

  useEffect(() => {
    if (attempted.current || !authenticated || !address || !signerId) return;
    if (!balance.isSuccess || balance.data?.usdc != null) return;
    attempted.current = true;
    addSigners({ address, signers: [{ signerId }] })
      .then(() => queryClient.invalidateQueries({ queryKey: ['wallet-balance'] }))
      .catch((error) => {
        console.warn('[wallet] automatic signer consent failed:', error);
      });
  }, [authenticated, address, signerId, balance.isSuccess, balance.data, addSigners, queryClient]);
}
