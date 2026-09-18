import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/positions/route";

export const Route = createFileRoute("/api/positions")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
