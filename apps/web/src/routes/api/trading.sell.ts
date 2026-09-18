import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/trading/sell/route";

export const Route = createFileRoute("/api/trading/sell")({
  server: {
    handlers: {
      POST: ({ request }) => handlers.POST(request),
    },
  },
});
