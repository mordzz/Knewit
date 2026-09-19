'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Fab } from '@/components/Fab';
import { SideNav } from '@/components/SideNav';
import { TopHeader } from '@/components/TopHeader';
import { Text } from '@/components/ui/Text';
import { useAutoWalletSetup } from '@/hooks/useAutoWalletSetup';
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
 * **Setup gate**: `useAutoWalletSetup` creates the embedded wallet and
 * grants the backend signing key automatically, and until it reports
 * `ready` this renders a "Setting up your account" state instead of the
 * tabs — the user never lands mid-setup, and no manual buttons exist
 * for either step any more (docs/DECISIONS.md, "Automatic Wallet &
 * Trading Setup — No Manual Buttons").
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, canUseApp, isGuest, privyUser } = useSession();
  const exitGuest = useGuestStore((state) => state.exitGuest);
  const setup = useAutoWalletSetup();

  useEffect(() => {
    if (ready && !canUseApp) {
      router.replace('/sign-in');
    }
  }, [ready, canUseApp, router]);

  // A real Privy login while guest mode is active (e.g. signing in from
  // the guest session) takes over — drop the sandbox and render the real
  // session, same rule as mobile's `PrivySessionBridge`.
  useEffect(() => {
    if (privyUser && isGuest) exitGuest();
  }, [privyUser, isGuest, exitGuest]);

  if (!ready || !canUseApp) {
    return null;
  }

  if (!isGuest && setup.status !== 'ready') {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-2xl flex-col items-center justify-center gap-3 border-x border-border px-6 text-center lg:max-w-none lg:border-x-0">
        {setup.status === 'error' ? (
          <>
            <Text variant="bodyStrong" className="block">
              We couldn&apos;t finish setting up your account
            </Text>
            <Text variant="caption" color="textSecondary" className="block">
              We&apos;ll try again next time you open the app — your wallet and funds are safe.
            </Text>
          </>
        ) : (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <Text variant="bodyStrong" className="block">
              Setting up your account…
            </Text>
            <Text variant="caption" color="textSecondary" className="block">
              Creating your wallet and enabling trading. This only happens once.
            </Text>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-screen w-full max-w-2xl flex-col border-x border-border lg:h-auto lg:min-h-screen lg:max-w-none lg:border-x-0">
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
