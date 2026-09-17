'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useCreateWallet } from '@privy-io/react-auth';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Fab } from '@/components/Fab';

/**
 * Shell for every authenticated page (Home, Markets, Search,
 * Leaderboard, Profile, …) — a direct conversion of `apps/mobile`'s
 * `MainTabNavigator`, not a desktop-pattern redesign: same bottom tab
 * bar, same FAB, same single scrolling column, just rendered inside a
 * wider centered frame (`max-w-2xl`, bordered on both sides) instead of
 * a literal phone width, so it reads as the mobile app viewed on a
 * bigger screen rather than a different product. The frame is pinned
 * to the viewport height with its own internal scroll (`overflow-y-
 * auto` below) so the tab bar stays fixed at the bottom of the frame
 * exactly like a native screen's tab bar, rather than scrolling away
 * with page content. Same "Hard Login Gate" the mobile app's
 * `RootNavigator` enforces (docs/DECISIONS.md): signed-out visitors are
 * bounced to `/sign-in`, which deliberately sits *outside* this route
 * group (`app/sign-in/`, not `app/(app)/sign-in/`) so it never gets
 * this chrome.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const attemptedWalletCreation = useRef(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/sign-in');
    }
  }, [ready, authenticated, router]);

  // `providers.tsx`'s `embeddedWallets.ethereum.createOnLogin` only
  // fires as part of the login flow itself — it does nothing for a
  // visitor who is already authenticated from a previous session (e.g.
  // one created before this config existed, or whose automatic
  // creation silently failed) and still has no wallet. Every other
  // authenticated page reads `user.wallet` (Wallet, trading)
  // assuming one exists, so this backstops it exactly once per session
  // here in the shared shell — the same "create the wallet manually"
  // step `apps/mobile`'s sign-in screen already does explicitly (see
  // `app/sign-in/page.tsx`'s doc comment on the difference). Guarded by
  // a ref, not just the `!user?.wallet` dependency, so React's dev-mode
  // double-invoke doesn't fire two concurrent create attempts.
  useEffect(() => {
    if (!ready || !authenticated || user?.wallet || attemptedWalletCreation.current) return;
    attemptedWalletCreation.current = true;
    createWallet().catch((error) => {
      console.error('Embedded wallet creation failed:', error);
    });
  }, [ready, authenticated, user?.wallet, createWallet]);

  if (!ready || !authenticated) {
    return null;
  }

  return (
    <div className="relative mx-auto flex h-screen w-full max-w-2xl flex-col overflow-hidden border-x border-border">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <BottomTabBar />
      <Fab />
    </div>
  );
}
