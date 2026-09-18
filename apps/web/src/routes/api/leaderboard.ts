import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/leaderboard/route";

export const Route = createFileRoute("/api/leaderboard")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
