import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/markets/route";

export const Route = createFileRoute("/api/markets")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
