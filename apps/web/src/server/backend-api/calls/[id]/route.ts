import { ApiError, notFound, withErrorHandling } from "@/lib/apiError";
import { optionalAuth, requireAuth } from "@/lib/privy";
import { getOrCreateUser } from "@/lib/users";
import { getSupabase } from "@/lib/supabase";
import { buildFeedItems, type PostRow } from "@/lib/social";

/** `GET /calls/:id` — a single Callout (Call Detail). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const viewer = await optionalAuth(request);
    const viewerUserRow = viewer ? await getOrCreateUser(viewer.privyUserId) : null;

    const supabase = getSupabase();
    const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
    if (!post) throw notFound(`Call ${id} not found.`);

    const [feedItem] = await buildFeedItems([post as PostRow], viewerUserRow?.id ?? null);
    return Response.json(feedItem);
  });
}

/** `DELETE /calls/:id` — the backend independently verifies ownership
 * (docs/API.md, same rule as `DELETE /comments/:id`); `comments` and
 * `likes` rows cascade on the FK. Returns `{}` rather than a bare 204
 * since the mobile client's `apiRequest` always calls
 * `response.json()`. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const supabase = getSupabase();
    const { data: post } = await supabase
      .from("posts")
      .select("id, author_id")
      .eq("id", id)
      .maybeSingle();
    if (!post) throw notFound(`Call ${id} not found.`);
    if (post.author_id !== viewer.id) {
      throw new ApiError(403, "forbidden", "You can only delete your own Calls.");
    }

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;

    return Response.json({});
  });
}
