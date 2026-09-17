/** Mirrors `apps/frontend/src/types/common.ts` — this backend is a
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
