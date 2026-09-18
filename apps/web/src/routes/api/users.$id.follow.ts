import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/users/[id]/follow/route";

export const Route = createFileRoute("/api/users/$id/follow")({
  server: {
    handlers: {
      POST: ({ request, params }) => handlers.POST(request, { params: Promise.resolve(params) }),
      DELETE: ({ request, params }) =>
        handlers.DELETE(request, { params: Promise.resolve(params) }),
    },
  },
});
