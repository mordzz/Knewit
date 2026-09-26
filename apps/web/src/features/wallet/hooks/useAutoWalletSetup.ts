'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrivy, useCreateWallet, useSigners, useUser } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { publicEnv } from '@/lib/publicEnv';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';

export type WalletSetupStatus = 'preparing' | 'ready' | 'error';

// Remembers, per wallet, that setup already finished once  otherwise every
// refresh waits on the balance read before the app shell lets the user in.
const setupKey = (address: string) => `knewit:setup-complete:${address}`;

function hasCompletedSetup(address: string): boolean {
  try {
    return window.localStorage.getItem(setupKey(address)) === '1';
  } catch {
    return false;
  }
}

function markSetupComplete(address: string) {
  try {
    window.localStorage.setItem(setupKey(address), '1');
  } catch {
    // Storage blocked  the gate just shows again next load.
  }
}

/**
 * Fully automatic account setup  the manual "Connect Wallet" and "Enable
 * trading" buttons were removed by request (docs/DECISIONS.md, "Automatic
 * Wallet & Trading Setup  No Manual Buttons"). Runs the two steps a new
 * account needs, in order, once per session:
 *
 * 1. **Create the embedded wallet** when the authenticated user has none
 *    (`providers.tsx`'s `createOnLogin` only fires inside the login flow
 *    itself, so a session that predates it  or whose automatic creation
 *    failed  still gets one here).
 * 2. **Grant the backend's authorization key signing authority** via
 *    `useSigners().addSigners`, Privy's owner-consent flow, once the
 *    balance read proves it isn't attached yet (`usdc === null` on a
 *    successful read)  docs/WALLET.md, "Backend Signing".
 *
 * The returned `status` drives the app shell's setup gate, so the user
 * never lands inside the app before this finishes. Failures are real and
 * surfaced (`error`), never retried in a loop: the next app open gets a
 * fresh attempt, and the Wallet screen states plainly what's missing.
 */
export function useAutoWalletSetup(): { status: WalletSetupStatus } {
  const { ready, authenticated, user } = usePrivy();
  const { refreshUser } = useUser();
  const { createWallet } = useCreateWallet();
  const { addSigners } = useSigners();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();
  const attemptedCreation = useRef(false);
  const attemptedSigner = useRef(false);
  const [refreshedWallet, setRefreshedWallet] = useState<{ userId: string; address: string } | null>(null);
  const [setupStartedAt, setSetupStartedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [signerGranted, setSignerGranted] = useState(false);
  const [signerAttempted, setSignerAttempted] = useState(false);

  const userId = user?.id ?? null;
  const address =
    user?.wallet?.address ??
    (refreshedWallet?.userId === userId ? refreshedWallet.address : null);
  const signerId = publicEnv.privySignerId;

  useEffect(() => {
    if (!ready || !authenticated || setupStartedAt != null) return;
    const timeout = window.setTimeout(() => setSetupStartedAt(Date.now()), 30_000);
    return () => window.clearTimeout(timeout);
  }, [ready, authenticated, setupStartedAt]);

  useEffect(() => {
    if (!ready || !authenticated || !userId || address || attemptedCreation.current) return;
    attemptedCreation.current = true;
    let active = true;

    const captureWallet = (walletAddress?: string | null) => {
      if (active && walletAddress && userId) {
        setRefreshedWallet({ userId, address: walletAddress });
      }
    };

    const refreshWallet = async () => {
      const refreshedUser = await refreshUser();
      captureWallet(refreshedUser?.wallet?.address);
      return refreshedUser;
    };

    // Privy can finish creating the wallet before the user snapshot exposed
    // by usePrivy refreshes. Keep the returned user address in local state as
    // well as refreshing Privy's context so setup can progress immediately.
    const refreshTimer = window.setInterval(() => {
      void refreshWallet().catch(() => undefined);
    }, 3000);

    createWallet()
      .then(async (wallet) => {
        captureWallet(wallet.address);
        await refreshWallet();
      })
      .catch(async (error) => {
        console.error('Embedded wallet creation failed:', error);
        try {
          const refreshedUser = await refreshWallet();
          if (active && !refreshedUser.wallet?.address) setFailed(true);
        } catch {
          if (active) setFailed(true);
        }
      });

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [ready, authenticated, address, userId, createWallet, refreshUser]);

  useEffect(() => {
    if (attemptedSigner.current || !authenticated || !address || !signerId) return;
    // Skip requesting consent again when the balance already reads
    // successfully with a usable value  the signer already works, and
    // asking Privy for a redundant grant can itself fail and flip an
    // otherwise-healthy wallet's status to 'error'.
    if (!balance.isSuccess || balance.data?.usdc != null) return;
    attemptedSigner.current = true;
    setSignerAttempted(true);
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

  // If the signer consent call completes on Privy's side but its promise or
  // the first balance response is stale, re-check the backend authorization
  // state until the gate sees a usable balance or signerGranted resolves it.
  useEffect(() => {
    if (!signerAttempted || !address || signerGranted || balance.data?.usdc != null) return;
    const refreshTimer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    }, 4000);
    return () => window.clearInterval(refreshTimer);
  }, [signerAttempted, address, signerGranted, balance.data?.usdc, queryClient]);

  // A wallet that finished setup before is let straight in; the checks
  // above keep running in the background (a failure then only warns).
  const alreadySetUp = authenticated && address != null && typeof window !== 'undefined' && hasCompletedSetup(address);

  // Ready once the wallet exists and either signing already works
  // (`usdc` readable), no signer is configured, consent just succeeded, or
  // the balance read itself errored  in that last case there is nothing
  // more this automatic path can do, so waiting on it would just block
  // readiness (and `markSetupComplete`, below) indefinitely for no benefit.
  const setupReady = !signerId || signerGranted || (balance.isSuccess && balance.data?.usdc != null) || balance.isError;

  // Provider responses can be HTTP 200 with { usdc: null, unavailable: true }.
  // Keep the short timeout to avoid trapping navigation, but don't persist it
  // as completed setup. A later login can retry the real balance/signer check.
  const setupTimedOut = setupStartedAt != null;

  let status: WalletSetupStatus;
  if (!authenticated || alreadySetUp) status = 'ready';
  else if (balance.data?.usdc != null || setupTimedOut) status = 'ready';
  else if (failed) status = 'error';
  else if (!address) status = 'preparing';
  else status = setupReady ? 'ready' : 'preparing';

  useEffect(() => {
  if (status === 'ready' && authenticated && address && setupReady) markSetupComplete(address);
  }, [status, authenticated, address, setupReady]);

  return { status };
}
