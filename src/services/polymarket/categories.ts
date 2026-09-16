import { fetchTagBySlug } from '@/services/polymarket/gammaClient';
import type { GammaTag } from '@/services/polymarket/gammaClient';

/**
 * This app's `KNOWN_CATEGORIES` (`types/common.ts`) mapped to
 * Polymarket's own tag slugs — verified one at a time against the live
 * `/tags/slug/{slug}` endpoint, not guessed. Most match the category
 * name directly lowercased/hyphenated; "World Events" doesn't exist as
 * a Polymarket tag under that name, so it maps to their closest
 * equivalent, "Geopolitics".
 */
const CATEGORY_SLUGS: Record<string, string> = {
  Politics: 'politics',
  Sports: 'sports',
  Crypto: 'crypto',
  'Pop Culture': 'pop-culture',
  Business: 'business',
  Economics: 'economics',
  Technology: 'technology',
  'World Events': 'geopolitics',
};

/** `null` for "Trending" (no tag filter — sorted by volume instead) or
 * any category with no known Polymarket tag mapping. */
export async function resolveCategoryTagId(category: string | undefined): Promise<string | null> {
  if (!category || category === 'Trending') return null;
  const slug = CATEGORY_SLUGS[category];
  if (!slug) return null;
  const tag = await fetchTagBySlug(slug);
  return tag?.id ?? null;
}

const SLUG_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([category, slug]) => [slug, category])
);

/**
 * The reverse direction — a single market fetched directly (Market
 * Detail, opened from a deep link/search result/callout, not from a
 * category-filtered list the caller already knows the category of)
 * only gets its tags back from Polymarket, not one clean category
 * string. Picks the first tag that matches one of this app's own known
 * categories; a market can carry dozens of granular tags ("HFC", "Earn
 * 4%") that aren't real categories at all, so matching against the
 * known slug set (rather than just taking `tags[0]`) is what keeps this
 * honest — see docs/DECISIONS.md ("Direct Polymarket Integration for
 * Market Data").
 */
export function deriveCategoryFromTags(tags: GammaTag[] | undefined): string {
  if (!tags) return 'General';
  for (const tag of tags) {
    const match = SLUG_TO_CATEGORY[tag.slug];
    if (match) return match;
  }
  return tags[0]?.label ?? 'General';
}
