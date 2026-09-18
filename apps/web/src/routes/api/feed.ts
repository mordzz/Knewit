import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/feed/route";

export const Route = createFileRoute("/api/feed")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
