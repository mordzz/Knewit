import type { MarketListItem, User } from '@/types/social';

/** Mirrors `apps/frontend/src/types/search.ts` exactly. */
export interface SearchResults {
  people: User[];
  markets: MarketListItem[];
}
