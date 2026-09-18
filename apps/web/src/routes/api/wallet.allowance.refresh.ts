import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/wallet/allowance/refresh/route";

export const Route = createFileRoute("/api/wallet/allowance/refresh")({
  server: {
    handlers: {
      POST: ({ request }) => handlers.POST(request),
    },
  },
});
