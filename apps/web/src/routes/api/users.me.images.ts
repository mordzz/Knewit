import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/users/me/images/route";

export const Route = createFileRoute("/api/users/me/images")({
  server: {
    handlers: {
      POST: ({ request }) => handlers.POST(request),
    },
  },
});
