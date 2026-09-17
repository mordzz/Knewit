'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoHome,
  IoHomeOutline,
  IoTrendingUp,
  IoTrendingUpOutline,
  IoSearch,
  IoSearchOutline,
  IoTrophy,
  IoTrophyOutline,
  IoPerson,
  IoPersonOutline,
} from 'react-icons/io5';
import type { IconType } from 'react-icons';

interface TabItem {
  href: string;
  label: string;
  icon: IconType;
  activeIcon: IconType;
}

/**
 * Direct conversion of `apps/mobile`'s `MainTabNavigator` bottom tab
 * bar — same five destinations, same icons, icon-only (no labels,
 * matching mobile's `tabBarShowLabel: false`), same active/inactive
 * color split. Not a left sidebar — this app's web version is meant to
 * look like the mobile app scaled up, not a separate desktop-pattern
 * redesign, so the navigation stays exactly where and how it is on
 * mobile.
 */
const TAB_ITEMS: TabItem[] = [
  { href: '/', label: 'Home', icon: IoHomeOutline, activeIcon: IoHome },
  { href: '/markets', label: 'Markets', icon: IoTrendingUpOutline, activeIcon: IoTrendingUp },
  { href: '/search', label: 'Search', icon: IoSearchOutline, activeIcon: IoSearch },
  { href: '/leaderboard', label: 'Leaderboard', icon: IoTrophyOutline, activeIcon: IoTrophy },
  { href: '/profile', label: 'Profile', icon: IoPersonOutline, activeIcon: IoPerson },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-shrink-0 border-t border-border bg-background">
      {TAB_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = isActive ? item.activeIcon : item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex flex-1 items-center justify-center py-3 ${
              isActive ? 'text-text-primary' : 'text-text-tertiary'
            }`}
          >
            <Icon size={26} />
          </Link>
        );
      })}
    </nav>
  );
}
