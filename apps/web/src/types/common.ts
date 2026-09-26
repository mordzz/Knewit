/** Mirrors `apps/frontend/src/types/common.ts`  this backend is a
 * separate package so it can't import mobile's types directly, but the
 * response shapes must match exactly since the mobile client is
 * already written against them (see docs/API.md). */
export type ID = string;
export type ISODateString = string;

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export type Category = string;

/**
 * One entry of `GET /categories`  a Polymarket tag's display label plus
 * the **slug** that must be sent back as the `category` filter. The slug
 * is the API's own identifier (`/tags/slug/:slug`); deriving it from the
 * label is wrong (`pop-culture` has label "Culture", and slugify("Culture")
 * produces a slug that matches nothing upstream).
 */
export interface CategoryOption {
  label: string;
  slug: string;
}
