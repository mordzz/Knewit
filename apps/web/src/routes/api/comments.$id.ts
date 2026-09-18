import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/comments/[id]/route";

export const Route = createFileRoute("/api/comments/$id")({
  server: {
    handlers: {
      DELETE: ({ request, params }) =>
        handlers.DELETE(request, { params: Promise.resolve(params) }),
    },
  },
});
