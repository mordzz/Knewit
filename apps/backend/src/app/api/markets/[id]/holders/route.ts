import { withErrorHandling } from '@/lib/apiError';

/** `GET /markets/:id/holders` — this market's top position holders
 * (docs/API.md). Returns an honest empty list: `Position` has no rows
 * yet (Phase 3 builds trading/positions) — never fabricated holders. */
export async function GET() {
  return withErrorHandling(async () => Response.json([]));
}
