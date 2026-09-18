import { createFileRoute } from "@tanstack/react-router";
import * as handlers from "@/server/backend-api/categories/route";

export const Route = createFileRoute("/api/categories")({
  server: {
    handlers: {
      GET: () => handlers.GET(),
    },
  },
});
