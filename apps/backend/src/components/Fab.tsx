'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoAdd } from 'react-icons/io5';

/**
 * Direct conversion of `apps/mobile`'s `FAB` (`components/ui/FAB`) —
 * same solid accent circle, same size, same position (bottom-right,
 * above the tab bar), same "Home only" visibility rule (mobile's
 * `MainTabNavigator` shows it only while the Home tab is focused — see
 * docs/DECISIONS.md). Links straight to `/create-call`, same
 * destination `onPress={() => navigation.navigate('CreateCall')}` goes
 * to on mobile.
 */
export function Fab() {
  const pathname = usePathname();
  if (pathname !== '/') return null;

  return (
    <Link
      href="/create-call"
      aria-label="Create a Callout"
      className="absolute bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-accent shadow-lg transition-opacity hover:opacity-85"
    >
      <IoAdd size={28} className="text-text-inverse" />
    </Link>
  );
}
