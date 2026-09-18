import { notFound, withErrorHandling } from "@/lib/apiError";
import { optionalAuth } from "@/lib/privy";
import { getOrCreateUser } from "@/lib/users";
import { getSupabase } from "@/lib/supabase";
import { fetchPage, parseCursor } from "@/lib/pagination";
import { buildCommentItems, type CommentRow } from "@/lib/social";
import type { Paginated } from "@/types/common";
import type { CommentItem } from "@/types/social";

/** `GET /comments/:id/replies` — direct replies to one top-level
 * comment (one level deep — docs/DECISIONS.md, "One Reply Level"). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const supabase = getSupabase();

    const { data: parent } = await supabase
      .from("comments")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!parent) throw notFound(`Comment ${id} not found.`);

    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const offset = parseCursor(url.searchParams.get("cursor"));
    const { items: rows, nextCursor: pageCursor } = await fetchPage<CommentRow>(
      supabase
        .from("comments")
        .select("*")
        .eq("parent_comment_id", id)
        .order("created_at", { ascending: true }),
      offset,
    );

    const items: CommentItem[] = await buildCommentItems(rows, viewerUserRow?.id ?? null);
    const page: Paginated<CommentItem> = { items, nextCursor: pageCursor };
    return Response.json(page);
  });
}
