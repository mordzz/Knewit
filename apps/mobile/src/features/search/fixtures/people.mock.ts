import type { User } from '@/types/social';

/**
 * DEVELOPMENT-ONLY fixture data — same rule as every other `*.mock.ts`
 * in this app: used solely as a local fallback when the real
 * `/search` backend is unreachable, never presented as real user data.
 * `avatarUrl` is intentionally `null` on every entry (not fetching from
 * arbitrary third-party image hosts for mock data), exercising
 * `Avatar`'s initial-letter fallback.
 */
const BASE_PEOPLE: User[] = [
  {
    id: 'user-dzaka',
    handle: 'dzakaal',
    displayName: 'Dzaka Al Fikri',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'user-jordan',
    handle: 'jordan_p',
    displayName: 'Jordan P',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'user-maya',
    handle: 'maya.k',
    displayName: 'Maya K',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'user-theo',
    handle: 'theotrades',
    displayName: 'Theo',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'user-aria',
    handle: 'aria_watches',
    displayName: 'Aria',
    avatarUrl: null,
    walletAddress: null,
  },
];

/** Case-insensitive substring match against handle or display name —
 * a simple, deterministic MVP ranking signal per docs/PRD.md; not a
 * fabricated relevance score. */
export function searchMockPeople(query: string): User[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return BASE_PEOPLE.filter(
    (person) =>
      person.handle.toLowerCase().includes(needle) ||
      person.displayName.toLowerCase().includes(needle)
  );
}
