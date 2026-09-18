import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/wallet/balance/route";

export const Route = createFileRoute("/api/wallet/balance")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
