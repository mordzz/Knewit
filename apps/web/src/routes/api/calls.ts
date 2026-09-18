import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/calls/route";

export const Route = createFileRoute("/api/calls")({
  server: {
    handlers: {
      POST: ({ request }) => handlers.POST(request),
    },
  },
});
