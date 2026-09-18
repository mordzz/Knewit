import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/calls/[id]/like/route";

export const Route = createFileRoute("/api/calls/$id/like")({
  server: {
    handlers: {
      POST: ({ request, params }) => handlers.POST(request, { params: Promise.resolve(params) }),
      DELETE: ({ request, params }) =>
        handlers.DELETE(request, { params: Promise.resolve(params) }),
    },
  },
});
