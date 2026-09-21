import { useEffect, useRef, useState } from 'react';
import { useEmbeddedEthereumWallet, useSigners } from '@privy-io/expo';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/app/config/env';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useGuestStore } from '@/store/guest/guestStore';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';

export type WalletSetupStatus = 'preparing' | 'ready' | 'error';

/**
 * Mobile wallet setup flow backed by the API in `apps/web` —
 * fully automatic account setup, with the manual "Connect Wallet" and
 * "Enable trading" buttons removed by request (docs/DECISIONS.md,
 * "Automatic Wallet & Trading Setup — No Manual Buttons"). Runs the two
 * steps a new account needs, in order, once per session:
 *
 * 1. **Create the embedded wallet** when the authenticated user has none
 *    (previously done ad hoc by `SignInScreen`; now owned here so every
 *    authenticated path gets it).
 * 2. **Grant the backend's authorization key signing authority** via
 *    `useSigners().addSigners`, Privy's owner-consent flow, once the
 *    balance read proves it isn't attached yet (`usdc === null` on a
 *    successful read) — docs/WALLET.md, "Backend Signing".
 *
 * `RootNavigator` renders the setup screen while this is not `ready`, so
 * a fresh login never lands mid-setup. Failures are real and surfaced
 * (`error`), never retried in a loop: the next app open gets a fresh
 * attempt, and the Wallet screen states plainly what's missing.
 */
export function useAutoWalletSetup(): { status: WalletSetupStatus } {
  const { isAuthenticated } = useAuth();
  const isGuest = useGuestStore((state) => state.isGuest);
  const { isConnected, address } = useWallet();
  const { create: createWallet } = useEmbeddedEthereumWallet();
  const { addSigners } = useSigners();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();
  const attemptedCreation = useRef(false);
  const attemptedSigner = useRef(false);
  const [failed, setFailed] = useState(false);
  const [signerGranted, setSignerGranted] = useState(false);

  const signerId = env.privySignerId;

  useEffect(() => {
    if (!isAuthenticated || isConnected || attemptedCreation.current) return;
    attemptedCreation.current = true;
    createWallet().catch((error) => {
      if (__DEV__) console.warn('[wallet] embedded wallet creation failed', error);
      setFailed(true);
    });
  }, [isAuthenticated, isConnected, createWallet]);

  useEffect(() => {
    if (attemptedSigner.current || !isConnected || !address || !signerId) return;
    if (!balance.isSuccess || balance.data?.usdc != null) return;
    attemptedSigner.current = true;
    addSigners({ address, signers: [{ signerId, policyIds: [] }] })
      .then(() => {
        setSignerGranted(true);
        return queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      })
      .catch((error) => {
        if (__DEV__) console.warn('[wallet] automatic signer consent failed', error);
        setFailed(true);
      });
  }, [isConnected, address, signerId, balance.isSuccess, balance.data, addSigners, queryClient]);

  // Guest mode has no real wallet to create or signer consent to grant —
  // the sandbox wallet is already "connected" (see `useWallet`).
  if (isGuest) return { status: 'ready' };
  if (!isAuthenticated) return { status: 'ready' };
  if (failed) return { status: 'error' };
  if (!isConnected || !address) return { status: 'preparing' };

  // Ready once the wallet exists and either signing already works
  // (`usdc` readable), no signer is configured, consent just succeeded,
  // or the balance read itself errored — in that last case there is
  // nothing more this automatic path can do.
  const signerReady = !signerId || signerGranted || balance.data?.usdc != null || balance.isError;
  return { status: signerReady ? 'ready' : 'preparing' };
}
