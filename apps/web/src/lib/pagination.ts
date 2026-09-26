export const DEFAULT_PAGE_SIZE = 20;

/** Opaque numeric-offset cursor, same convention as Phase 1's
 * `gammaClient.fetchEventsPage`  simple and correct; not the most
 * efficient at large scale (a real keyset cursor would be), left as a
 * documented simplification since nothing in this app has enough rows
 * yet to matter. */
export function parseCursor(cursor: string | null): number {
  const n = Number(cursor);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function nextCursor(offset: number, returned: number, pageSize = DEFAULT_PAGE_SIZE): string | null {
  return returned > pageSize ? String(offset + pageSize) : null;
}

/** Fetches one page from a Supabase query builder  requests
 * `pageSize + 1` rows so `nextCursor` can tell "more rows exist"
 * without a separate count query, then trims back to `pageSize`. */
export async function fetchPage<T>(
  query: { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }> },
  offset: number,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ items: T[]; nextCursor: string | null }> {
  const { data, error } = await query.range(offset, offset + pageSize);
  if (error) throw error;
  const rows = data ?? [];
  return {
    items: rows.slice(0, pageSize),
    nextCursor: nextCursor(offset, rows.length, pageSize),
  };
}
