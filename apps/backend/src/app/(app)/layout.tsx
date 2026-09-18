'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { BottomTabBar } from '@/components/BottomTabBar';
import { SideNav } from '@/components/SideNav';
import { RightRail } from '@/components/RightRail';
import { Fab } from '@/components/Fab';
import { Text } from '@/components/ui/Text';
import { useAutoWalletSetup } from '@/hooks/useAutoWalletSetup';

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
  const { ready, authenticated } = usePrivy();
  const setup = useAutoWalletSetup();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/sign-in');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return null;
  }

  if (setup.status !== 'ready') {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-2xl flex-col items-center justify-center gap-3 border-x border-border px-6 text-center">
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
    <div className="relative mx-auto flex h-screen w-full max-w-[1265px]">
      {/* Desktop rail (lg+); the phone-width bottom bar below hides at the
          same breakpoint — one navigation at a time. */}
      <SideNav />

      <div className="relative flex min-h-0 min-w-0 flex-1 justify-center">
        {/* The content column keeps the mobile app's own width and chrome
            (`max-w-2xl`, bordered) — the desktop layout only adds the
            rail beside it; every page's mobile UI is untouched. */}
        <div className="relative flex min-h-0 w-full flex-col lg:max-w-2xl lg:border-x lg:border-border">
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          <BottomTabBar />
          <Fab />
        </div>
      </div>

      {/* Desktop-only "Who to follow" column (xl+). */}
      <RightRail />
    </div>
  );
}
