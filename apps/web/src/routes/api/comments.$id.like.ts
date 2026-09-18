import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/comments/[id]/like/route";

export const Route = createFileRoute("/api/comments/$id/like")({
  server: {
    handlers: {
      POST: ({ request, params }) => handlers.POST(request, { params: Promise.resolve(params) }),
      DELETE: ({ request, params }) =>
        handlers.DELETE(request, { params: Promise.resolve(params) }),
    },
  },
});
