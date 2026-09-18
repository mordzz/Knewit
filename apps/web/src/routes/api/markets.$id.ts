import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/markets/[id]/route";

export const Route = createFileRoute("/api/markets/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
    },
  },
});
