import { twMerge } from 'tailwind-merge';

/**
 * `twMerge` resolves conflicts for standard Tailwind utility patterns
 * (e.g. `rounded-sm` vs `rounded-lg`, `p-2` vs `p-4`) correctly out of
 * the box  it doesn't need to know the custom px values our
 * `tailwind.config.js` assigns them, only the class-name pattern. Our
 * custom-named tokens (`text-text-primary`, `bg-accent-muted`, etc., from
 * `theme/tw.ts`) aren't in a recognized conflict group, so they pass
 * through unmerged rather than being misclassified  same as plain
 * concatenation for those, no regression. Deliberately not using
 * `extendTailwindMerge` to teach it those groups  not worth the added
 * config surface for cases that don't come up in practice (callers
 * override color/size via component props, not raw className).
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
