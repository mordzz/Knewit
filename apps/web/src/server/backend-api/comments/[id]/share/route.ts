import { notFound, withErrorHandling } from "@/lib/apiError";
import { requireAuth } from "@/lib/privy";
import { getOrCreateUser } from "@/lib/users";
import { getSupabase } from "@/lib/supabase";
import type { ShareResult } from "@/types/social";

/** `POST /comments/:id/share` — increment-only, no "unshare"
 * (docs/API.md's `ShareResult` — distinct from `LikeResult`'s toggle).
 * A blind increment is fine here (unlike likes) since there's no
 * unique-row source of truth to recompute from — each call is a
 * genuine new share event. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { privyUserId } = await requireAuth(request);
    await getOrCreateUser(privyUserId);

    const supabase = getSupabase();
    const { data: comment } = await supabase
      .from("comments")
      .select("share_count")
      .eq("id", id)
      .maybeSingle();
    if (!comment) throw notFound(`Comment ${id} not found.`);

    const shareCount = (comment.share_count ?? 0) + 1;
    const { error } = await supabase
      .from("comments")
      .update({ share_count: shareCount })
      .eq("id", id);
    if (error) throw error;

    const result: ShareResult = { shareCount };
    return Response.json(result);
  });
}
