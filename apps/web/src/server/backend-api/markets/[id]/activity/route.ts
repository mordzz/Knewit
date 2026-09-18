import { withErrorHandling } from "@/lib/apiError";
import { optionalAuth } from "@/lib/privy";
import { getOrCreateUser } from "@/lib/users";
import { getSupabase } from "@/lib/supabase";
import { buildFeedItems, type PostRow } from "@/lib/social";

const ACTIVITY_LIMIT = 20;

/** `GET /markets/:id/activity` — Posts/Calls referencing this market
 * (docs/API.md). Not paginated (a fixed, reasonably small batch, per
 * contract) — newest first. Phase 1 stubbed this empty since `Post`
 * had no rows yet; now backed by real data from Phase 2. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const { data: postRows } = await getSupabase()
      .from("posts")
      .select("*")
      .eq("market_id", id)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT);

    const items = await buildFeedItems((postRows ?? []) as PostRow[], viewerUserRow?.id ?? null);
    return Response.json(items);
  });
}
