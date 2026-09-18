import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/events/route";

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      GET: () => handlers.GET(),
    },
  },
});
