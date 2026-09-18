import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/feed/following/route";

export const Route = createFileRoute("/api/feed/following")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
