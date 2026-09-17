import { withErrorHandling } from '@/lib/apiError';
import { getSupabase } from '@/lib/supabase';
import { searchEvents } from '@/lib/polymarket/gammaClient';
import { toMarketListItems } from '@/lib/polymarket/normalize';
import type { SearchResults } from '@/types/search';
import type { MarketListItem } from '@/types/social';

const PEOPLE_LIMIT = 10;
const MARKET_ITEM_LIMIT = 10;

/** `GET /search?q=` — people (our own `users` table) and markets
 * (Polymarket's `/public-search`, docs/API.md — both sections always
 * returned together, no `scope` param). A query under 2 characters
 * (mirroring the mobile client's own debounce/length gate) returns an
 * honestly empty result rather than a broad, meaningless match. */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();

    if (q.length < 2) {
      const empty: SearchResults = { people: [], markets: [] };
      return Response.json(empty);
    }

    const supabase = getSupabase();
    const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);

    const [{ data: userRows }, events] = await Promise.all([
      supabase
        .from('users')
        .select('id, handle, display_name, avatar_url, wallet_address')
        .or(`handle.ilike.%${escaped}%,display_name.ilike.%${escaped}%`)
        .limit(PEOPLE_LIMIT),
      searchEvents(q, 10),
    ]);

    const people = (userRows ?? []).map((u) => ({
      id: u.id as string,
      handle: u.handle as string,
      displayName: u.display_name as string,
      avatarUrl: u.avatar_url as string | null,
      walletAddress: u.wallet_address as string | null,
    }));

    const markets: MarketListItem[] = events.flatMap(toMarketListItems).slice(0, MARKET_ITEM_LIMIT);

    const results: SearchResults = { people, markets };
    return Response.json(results);
  });
}
