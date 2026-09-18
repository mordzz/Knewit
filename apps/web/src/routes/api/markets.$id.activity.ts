import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/markets/[id]/activity/route";

export const Route = createFileRoute("/api/markets/$id/activity")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
    },
  },
});
