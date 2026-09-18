import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/comments/[id]/share/route";

export const Route = createFileRoute("/api/comments/$id/share")({
  server: {
    handlers: {
      POST: ({ request, params }) => handlers.POST(request, { params: Promise.resolve(params) }),
    },
  },
});
