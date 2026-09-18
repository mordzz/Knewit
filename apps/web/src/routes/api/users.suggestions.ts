import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/users/suggestions/route";

export const Route = createFileRoute("/api/users/suggestions")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
