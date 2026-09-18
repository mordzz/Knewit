import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/users/[id]/route";

export const Route = createFileRoute("/api/users/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlers.GET(request, { params: Promise.resolve(params) }),
      PATCH: ({ request, params }) => handlers.PATCH(request, { params: Promise.resolve(params) }),
    },
  },
});
