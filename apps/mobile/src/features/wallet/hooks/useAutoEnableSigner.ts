import { useEffect, useRef } from 'react';
import { useSigners } from '@privy-io/expo';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/app/config/env';
import { useWallet } from '@/hooks/useWallet';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';

/**
 * Mobile equivalent of `apps/backend/src/hooks/useAutoEnableSigner.ts` —
 * grants the backend's authorization key signing authority on the
 * viewer's embedded wallet once per session (`useSigners().addSigners`,
 * Privy's owner-consent flow; docs/WALLET.md, "Backend Signing"). Runs
 * only when the balance read proves the signer isn't attached yet, and
 * the Wallet screen's button remains as a manual retry on failure.
 */
export function useAutoEnableSigner() {
  const { isConnected, address } = useWallet();
  const { addSigners } = useSigners();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  const signerId = env.privySignerId;

  useEffect(() => {
    if (attempted.current || !isConnected || !address || !signerId) return;
    if (!balance.isSuccess || balance.data?.usdc != null) return;
    attempted.current = true;
    addSigners({ address, signers: [{ signerId, policyIds: [] }] })
      .then(() => queryClient.invalidateQueries({ queryKey: ['wallet-balance'] }))
      .catch((error) => {
        if (__DEV__) console.warn('[wallet] automatic signer consent failed', error);
      });
  }, [isConnected, address, signerId, balance.isSuccess, balance.data, addSigners, queryClient]);
}
