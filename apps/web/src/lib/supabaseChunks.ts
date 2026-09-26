/** PostgREST `.in(column, ids)` puts every id in the request URL, which
 * breaks down on events with hundreds of child markets (verified
 * failure mode: an honest-looking empty result, not an error). These
 * helpers run the same query once per batch and concatenate the rows,
 * throwing on a real query error so callers never mistake a failure for
 * "no data". */
export const IN_BATCH_SIZE = 50;

interface QueryResult<T> {
  data: T[] | null;
  error: unknown;
}

/** Runs `buildQuery` once per batch of `ids` and concatenates the rows.
 * Order is preserved per batch, not globally  callers re-sort if the
 * order matters. */
export async function selectInChunks<T>(
  ids: string[],
  buildQuery: (batch: string[]) => PromiseLike<QueryResult<T>>
): Promise<T[]> {
  const rows: T[] = [];
  for (let index = 0; index < ids.length; index += IN_BATCH_SIZE) {
    const batch = ids.slice(index, index + IN_BATCH_SIZE);
    const { data, error } = await buildQuery(batch);
    if (error) throw error;
    rows.push(...(data ?? []));
  }
  return rows;
}
