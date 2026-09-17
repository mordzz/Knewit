import { withErrorHandling } from '@/lib/apiError';
import { fetchCategoryTags } from '@/lib/polymarket/gammaClient';
import type { Category } from '@/types/common';

/** `GET /categories` — live category list sourced from Polymarket's
 * tag taxonomy (docs/API.md) — see `fetchCategoryTags` for why this
 * resolves a fixed candidate slug list rather than paging Polymarket's
 * full (unordered, uncategorized) `/tags` list. */
export async function GET() {
  return withErrorHandling(async () => {
    const tags = await fetchCategoryTags();
    const categories: Category[] = tags.map((tag) => tag.label).sort((a, b) => a.localeCompare(b));
    return Response.json(categories);
  });
}
