import { notFound, withErrorHandling } from "@/lib/apiError";
import { optionalAuth } from "@/lib/privy";
import { getOrCreateUser, resolveTargetUserId } from "@/lib/users";
import { getSupabase } from "@/lib/supabase";
import { fetchPage, parseCursor } from "@/lib/pagination";
import { buildFeedItems, type PostRow } from "@/lib/social";
import type { Paginated } from "@/types/common";
import type { FeedItem } from "@/types/social";

/** `GET /users/:id/calls` — position-backed Calls
 * (`positionSnapshot !== null`) by this user, docs/API.md. Mirrors
 * `posts/route.ts` with the null-check inverted. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;
    const targetId = await resolveTargetUserId(id, viewer?.privyUserId ?? null);

    const supabase = getSupabase();
    const { data: target } = await supabase
      .from("users")
      .select("id")
      .eq("id", targetId)
      .maybeSingle();
    if (!target) throw notFound(`User ${id} not found.`);

    const offset = parseCursor(url.searchParams.get("cursor"));
    const { items: postRows, nextCursor: pageCursor } = await fetchPage<PostRow>(
      supabase
        .from("posts")
        .select("*")
        .eq("author_id", targetId)
        .not("position_snapshot_market_id", "is", null)
        .order("created_at", { ascending: false }),
      offset,
    );

    const items: FeedItem[] = await buildFeedItems(postRows, viewerUserRow?.id ?? null);
    const page: Paginated<FeedItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}
