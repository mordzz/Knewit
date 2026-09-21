'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@privy-io/react-auth';
import {
  IoWalletOutline,
  IoWallet,
  IoTimeOutline,
  IoTime,
  IoPersonCircleOutline,
  IoPersonCircle,
  IoLogOutOutline,
  IoSettingsOutline,
} from 'react-icons/io5';
import { TAB_ITEMS } from '@/components/BottomTabBar';
import { useSession } from '@/hooks/useSession';
import { useGuestStore } from '@/lib/guest/guestStore';

const WALLET_ITEM = {
  href: '/wallet',
  label: 'Wallet',
  icon: IoWalletOutline,
  activeIcon: IoWallet,
};

const ACTIVITY_ITEM = {
  href: '/activity',
  label: 'Activity',
  icon: IoTimeOutline,
  activeIcon: IoTime,
};

const PROFILE_ITEM = {
  href: '/profile',
  label: 'Profile',
  icon: IoPersonCircleOutline,
  activeIcon: IoPersonCircle,
};

/**
 * Desktop/tablet-only sidebar rail (`hidden lg:flex`), ported from
 * `apps/dekstop/src/components/knew/app-shell.tsx`'s left nav — same
 * fixed rail, same active/inactive treatment. Built from `TAB_ITEMS`
 * (the same routes `BottomTabBar` uses on phone) but not a straight
 * copy of it: `Search` moves into `TopHeader`'s search field instead of
 * a nav link, and `Profile` is dropped in favor of the "Account" button
 * below (same destination, `/profile`) — replaced with `Wallet` and a
 * new `Activity` entry (its own page now, split out of the Activity tab
 * that used to live inside Profile). This is the desktop counterpart
 * `BottomTabBar` renders on phone; the two never show at the same time
 * (`lg:hidden` / `hidden lg:flex`).
 */
export function SideNav() {
  const pathname = usePathname();
  const { canUseApp, isGuest } = useSession();
  const exitGuest = useGuestStore((state) => state.exitGuest);
  const { logout } = useLogout();
  const callouts = TAB_ITEMS.find((item) => item.href === '/callouts')!;
  const markets = TAB_ITEMS.find((item) => item.href === '/markets')!;
  const leaderboard = TAB_ITEMS.find((item) => item.href === '/leaderboard')!;
  const items = [callouts, markets, WALLET_ITEM, ACTIVITY_ITEM, leaderboard, PROFILE_ITEM];

  // Same rule `wallet/page.tsx`'s `handleLogout` follows: a guest session
  // has no Privy session to end, so leaving guest mode is the logout.
  const handleSignOut = () => {
    if (isGuest) {
      exitGuest();
      return;
    }
    logout();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-16 items-center px-5">
        <Image src="/icon.png" alt="" width={32} height={32} className="rounded-lg" />
        <span className="ml-2.5 text-lg font-inter-bold text-accent">Knew it</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Main navigation">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-inter-medium transition-colors ${
                isActive ? 'bg-surface-elevated text-text-primary' : 'text-text-secondary hover:bg-surface'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-inter-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-surface-elevated text-text-primary'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          }`}
        >
          <IoSettingsOutline size={20} />
          Settings
        </Link>
        {canUseApp ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-inter-medium text-text-secondary hover:bg-surface hover:text-text-primary"
          >
            <IoLogOutOutline size={20} />
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}
