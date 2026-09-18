import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/search/route";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
