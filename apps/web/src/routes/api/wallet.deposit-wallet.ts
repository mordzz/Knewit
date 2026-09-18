import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/wallet/deposit-wallet/route";

export const Route = createFileRoute("/api/wallet/deposit-wallet")({
  server: {
    handlers: {
      GET: ({ request }) => handlers.GET(request),
    },
  },
});
