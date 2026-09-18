import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/users/[id]/replies/route";

export const Route = createFileRoute("/api/users/$id/replies")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
    },
  },
});
