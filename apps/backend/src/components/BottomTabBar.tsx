'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoHome,
  IoHomeOutline,
  IoStatsChart,
  IoStatsChartOutline,
  IoSearch,
  IoSearchOutline,
  IoPodium,
  IoPodiumOutline,
  IoPersonCircle,
  IoPersonCircleOutline,
} from 'react-icons/io5';
import type { IconType } from 'react-icons';

export interface TabItem {
  href: string;
  label: string;
  icon: IconType;
  activeIcon: IconType;
}

/**
 * The five destinations, shared by the phone-width bottom bar below and
 * the desktop sidebar (`SideNav`) — one definition, so the two
 * navigations can never drift apart. Icons follow the "modern navbar"
 * pass (docs/DECISIONS.md, "Navbar Icons Modernized"): Markets is a
 * chart (`stats-chart`), Leaderboard a podium, Profile a circled person;
 * Home and Search keep their existing glyphs.
 */
export const TAB_ITEMS: TabItem[] = [
  { href: '/', label: 'Home', icon: IoHomeOutline, activeIcon: IoHome },
  { href: '/markets', label: 'Markets', icon: IoStatsChartOutline, activeIcon: IoStatsChart },
  { href: '/search', label: 'Search', icon: IoSearchOutline, activeIcon: IoSearch },
  { href: '/leaderboard', label: 'Leaderboard', icon: IoPodiumOutline, activeIcon: IoPodium },
  { href: '/profile', label: 'Profile', icon: IoPersonCircleOutline, activeIcon: IoPersonCircle },
];

/**
 * Direct conversion of `apps/mobile`'s `MainTabNavigator` bottom bar —
 * same five destinations, same icon-only style, same active/inactive
 * color split. Hidden from `lg` up, where `SideNav` takes over with the
 * X-style labeled rail (docs/DECISIONS.md, "Responsive Shell: Rail on
 * Tablet, Sidebar on Desktop").
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-shrink-0 border-t border-border bg-background lg:hidden">
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
