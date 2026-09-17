import { apiRequest } from '@/lib/apiClient';
import type { SearchResults } from '@/types/search';

/** Web equivalent of `apps/mobile/src/features/search/services/searchService.ts`
 * — always returns both People and Markets together, no dev-mock
 * fallback (this backend is always live for the web app). */
export async function search(query: string): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query });
  return apiRequest<SearchResults>(`/api/search?${params.toString()}`);
}
