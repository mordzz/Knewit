import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/calls/[id]/route";

export const Route = createFileRoute("/api/calls/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
      DELETE: ({ request, params }) =>
        handlers.DELETE(request, { params: Promise.resolve(params) }),
    },
  },
});
