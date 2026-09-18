import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/calls/[id]/comments/route";

export const Route = createFileRoute("/api/calls/$id/comments")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
      POST: ({ request, params }) => handlers.POST(request, { params: Promise.resolve(params) }),
    },
  },
});
