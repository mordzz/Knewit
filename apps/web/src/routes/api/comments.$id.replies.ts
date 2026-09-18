import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/comments/[id]/replies/route";

export const Route = createFileRoute("/api/comments/$id/replies")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
    },
  },
});
