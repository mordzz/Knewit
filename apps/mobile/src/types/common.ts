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
