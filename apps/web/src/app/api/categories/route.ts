import { withErrorHandling } from '@/lib/apiError';
import { fetchCategoryTags } from '@/lib/polymarket/gammaClient';
import type { CategoryOption } from '@/types/common';

/** `GET /categories`  live category list sourced from Polymarket's
 * tag taxonomy (docs/API.md)  see `fetchCategoryTags` for why this
 * resolves a fixed candidate slug list rather than paging Polymarket's
 * full (unordered, uncategorized) `/tags` list. Each entry carries the
 * tag's **slug** (the API's own key, used as the `GET /markets?category=`
 * filter value) alongside its display label  the client never derives
 * one from the other. */
export async function GET() {
  return withErrorHandling(async () => {
    const tags = await fetchCategoryTags();
    const categories: CategoryOption[] = tags
      .map((tag) => ({ label: tag.label, slug: tag.slug }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return Response.json(categories);
  });
}
