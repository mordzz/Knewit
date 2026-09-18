import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/markets/[id]/holders/route";

export const Route = createFileRoute("/api/markets/$id/holders")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
    },
  },
});
