export type ID = string;
export type ISODateString = string;

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Categories come from Polymarket's live taxonomy, not a hard-coded enum —
 * see docs/DECISIONS.md. This list is a non-exhaustive set of commonly seen
 * values, useful as a fallback/placeholder for filter UI only.
 */
export type Category = string;
export const KNOWN_CATEGORIES: Category[] = [
  'Politics',
  'Sports',
  'Crypto',
  'Pop Culture',
  'Business',
  'Economics',
  'Technology',
  'World Events',
];
