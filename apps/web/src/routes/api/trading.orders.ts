import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/trading/orders/route";

export const Route = createFileRoute("/api/trading/orders")({
  server: {
    handlers: {
      POST: ({ request }) => handlers.POST(request),
    },
  },
});
