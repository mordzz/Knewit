'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TAB_ITEMS } from '@/components/BottomTabBar';

/**
 * Desktop-only left rail â€” the X-style counterpart of the bottom tab bar,
 * shown from `lg` up (docs/DECISIONS.md, "Responsive Shell: Rail on
 * Tablet, Sidebar on Desktop"). Same five destinations as
 * `BottomTabBar` (one shared `TAB_ITEMS` definition), but with labels,
 * plus the app's primary action ("New Callout") as a full-width button
 * pinned to the column's bottom, which is why the floating FAB is hidden
 * on desktop. The mobile-width content column and every page's mobile UI
 * are untouched.
 *
 * The brand is the wordmark itself â€” "Knewit" in the brand yellow â€” with
 * a white divider under the logo block separating it from the nav, by
 * request (docs/DECISIONS.md, "Right Rail Mirrors the Sidebar; Yellow
 * Wordmark Logo").
 */
export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[275px] flex-shrink-0 flex-col px-3 py-4 lg:flex">
      <Link
        href="/"
        aria-label="Knewit home"
        className="mb-4 border-b border-white/30 px-3 pb-4"
      >
        <span className="font-inter-extrabold text-3xl text-accent">Knewit</span>
      </Link>

      {TAB_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = isActive ? item.activeIcon : item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex items-center gap-4 rounded-full px-3 py-3 text-lg font-semibold transition-colors hover:bg-surface ${
              isActive ? 'text-text-primary' : 'text-text-secondary'
            }`}
          >
            <Icon size={26} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <Link
        href="/create-call"
        className="mt-auto mb-2 flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-accent px-6 font-semibold text-text-inverse shadow-lg transition-opacity hover:opacity-90"
      >
        New Callout
      </Link>
    </aside>
  );
}
