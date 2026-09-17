import type { MarketListItem, User } from '@/types/social';

/**
 * `GET /search`'s response shape — both sections are always returned
 * together (never scoped to just one), since the Search screen shows
 * People and Markets side by side, not behind a toggle — see
 * docs/DECISIONS.md (Sprint 4). Reuses `User`/`MarketListItem` as-is;
 * no separate search-specific market/person model.
 */
export interface SearchResults {
  people: User[];
  markets: MarketListItem[];
}
