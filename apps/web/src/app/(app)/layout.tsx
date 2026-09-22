'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Fab } from '@/components/Fab';
import { SideNav } from '@/components/SideNav';
import { TopHeader } from '@/components/TopHeader';
import { useAutoWalletSetup } from '@/features/wallet/hooks/useAutoWalletSetup';
import { useSession } from '@/hooks/useSession';
import { useGuestStore } from '@/lib/guest/guestStore';

/**
 * Shell for every authenticated page (Home, Markets, Search,
 * Leaderboard, Profile, …) — a direct conversion of `apps/mobile`'s
 * `MainTabNavigator`: same bottom tab bar, same FAB, same single
 * scrolling column, rendered inside a phone-width frame (`max-w-2xl`,
 * bordered on both sides, pinned to the viewport height with its own
 * inner scroll) below the `lg` breakpoint. At `lg:` and up a `SideNav`
 * rail (ported from `apps/dekstop`'s `app-shell.tsx`) and `TopHeader`
 * take over instead of the bottom tab bar/FAB, the frame's border and
 * height lock go away so the page scrolls natively like a normal
 * website (the rail/header are `position: fixed`, so they stay pinned),
 * and no width cap is imposed here — each page owns its own width. Same "Hard
 * Login Gate" the mobile app's `RootNavigator` enforces
 * (docs/DECISIONS.md): signed-out visitors are bounced to `/sign-in`,
 * which deliberately sits *outside* this route group (`app/sign-in/`,
 * not `app/(app)/sign-in/`) so it never gets this chrome.
 *
 * **Background wallet setup**: useAutoWalletSetup creates the embedded
 * wallet and grants the backend signing key automatically. Navigation is
 * available while those provider steps finish; wallet-dependent actions
 * continue to check the actual wallet state.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, canUseApp, isGuest, privyUser } = useSession();
  const exitGuest = useGuestStore((state) => state.exitGuest);
  // Keep wallet provisioning active without blocking app navigation.
  useAutoWalletSetup();
  const [readyTimedOut, setReadyTimedOut] = useState(false);

  useEffect(() => {
    if (ready && !canUseApp) {
      router.replace('/sign-in');
    }
  }, [ready, canUseApp, router]);

  // Privy's own `ready` flag can stay false indefinitely (slow/failed SDK
  // bootstrap, e.g. right after an OAuth redirect back into the app).
  // Without this, the blank `return null` below never resolves and the app
  // looks frozen. After a bounded wait, bail out to `/sign-in` instead of
  // hanging forever.
  useEffect(() => {
    if (ready || readyTimedOut) return;
    const timeout = window.setTimeout(() => setReadyTimedOut(true), 15_000);
    return () => window.clearTimeout(timeout);
  }, [ready, readyTimedOut]);

  useEffect(() => {
    if (readyTimedOut && !ready) router.replace('/sign-in');
  }, [readyTimedOut, ready, router]);

  // A real Privy login while guest mode is active (e.g. signing in from
  // the guest session) takes over — drop the sandbox and render the real
  // session, same rule as mobile's `PrivySessionBridge`.
  useEffect(() => {
    if (privyUser && isGuest) exitGuest();
  }, [privyUser, isGuest, exitGuest]);

  if (!ready || !canUseApp) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden border-x border-border lg:h-auto lg:min-h-screen lg:max-w-none lg:overflow-visible lg:border-x-0">
      <SideNav />
      <TopHeader />
      <div className="min-h-0 flex-1 overflow-y-auto lg:ml-56 lg:overflow-visible lg:px-8 lg:pt-16 xl:px-12">
        {children}
      </div>
      <BottomTabBar />
      <Fab />
    </div>
  );
}
