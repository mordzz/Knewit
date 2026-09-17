export type ID = string;
export type ISODateString = string;

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Categories come from Polymarket's live taxonomy, not a hard-coded enum
 * — `MarketsScreen` fetches the real current list via `GET /categories`
 * (`eventService.ts::getCategories`) rather than keeping a local
 * fallback list here, which had drifted out of sync with what the
 * backend actually resolves category filters against — see
 * docs/DECISIONS.md.
 */
export type Category = string;

/**
 * One entry of `GET /categories`. The tab's `slug` is what goes back to
 * the API as the `category` filter — never a slug derived from the
 * label (`pop-culture`'s label is "Culture", so slugify(label) is
 * wrong upstream).
 */
export interface CategoryOption {
  label: string;
  slug: string;
}
