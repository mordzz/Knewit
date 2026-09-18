'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrivy, useCreateWallet, useSigners } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { publicEnv } from '@/lib/publicEnv';
import { useWalletBalance } from '@/hooks/useWalletBalance';

export type WalletSetupStatus = 'preparing' | 'ready' | 'error';

/**
 * Fully automatic account setup — the manual "Connect Wallet" and "Enable
 * trading" buttons were removed by request (docs/DECISIONS.md, "Automatic
 * Wallet & Trading Setup — No Manual Buttons"). Runs the two steps a new
 * account needs, in order, once per session:
 *
 * 1. **Create the embedded wallet** when the authenticated user has none
 *    (`providers.tsx`'s `createOnLogin` only fires inside the login flow
 *    itself, so a session that predates it — or whose automatic creation
 *    failed — still gets one here).
 * 2. **Grant the backend's authorization key signing authority** via
 *    `useSigners().addSigners`, Privy's owner-consent flow, once the
 *    balance read proves it isn't attached yet (`usdc === null` on a
 *    successful read) — docs/WALLET.md, "Backend Signing".
 *
 * The returned `status` drives the app shell's setup gate, so the user
 * never lands inside the app before this finishes. Failures are real and
 * surfaced (`error`), never retried in a loop: the next app open gets a
 * fresh attempt, and the Wallet screen states plainly what's missing.
 */
export function useAutoWalletSetup(): { status: WalletSetupStatus } {
  const { ready, authenticated, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { addSigners } = useSigners();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();
  const attemptedCreation = useRef(false);
  const attemptedSigner = useRef(false);
  const [failed, setFailed] = useState(false);
  const [signerGranted, setSignerGranted] = useState(false);

  const address = user?.wallet?.address ?? null;
  const signerId = publicEnv.privySignerId;

  useEffect(() => {
    if (!ready || !authenticated || address || attemptedCreation.current) return;
    attemptedCreation.current = true;
    createWallet().catch((error) => {
      console.error('Embedded wallet creation failed:', error);
      setFailed(true);
    });
  }, [ready, authenticated, address, createWallet]);

  useEffect(() => {
    if (attemptedSigner.current || !authenticated || !address || !signerId) return;
    if (!balance.isSuccess || balance.data?.usdc != null) return;
    attemptedSigner.current = true;
    addSigners({ address, signers: [{ signerId }] })
      .then(() => {
        setSignerGranted(true);
        return queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      })
      .catch((error) => {
        console.warn('[wallet] automatic signer consent failed:', error);
        setFailed(true);
      });
  }, [authenticated, address, signerId, balance.isSuccess, balance.data, addSigners, queryClient]);

  if (!authenticated) return { status: 'ready' };
  if (failed) return { status: 'error' };
  if (!address) return { status: 'preparing' };

  // Ready once the wallet exists and either signing already works
  // (`usdc` readable), no signer is configured, consent just succeeded,
  // or the balance read itself errored — in that last case there is
  // nothing more this automatic path can do.
  const signerReady =
    !signerId || signerGranted || balance.data?.usdc != null || balance.isError;
  return { status: signerReady ? 'ready' : 'preparing' };
}
