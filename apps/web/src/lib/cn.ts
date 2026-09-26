import { twMerge } from 'tailwind-merge';

/**
 * Copied verbatim from `apps/mobile/src/utils/cn.ts` (only the import
 * path differs  `@/lib/cn` here, matching this project's `lib`
 * convention rather than mobile's `utils`)  NativeWind/Tailwind
 * className strings merge identically either way `tailwind-merge`
 * doesn't need to know this app's custom token names, only the
 * class-name pattern (e.g. `rounded-sm` vs `rounded-lg`).
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
