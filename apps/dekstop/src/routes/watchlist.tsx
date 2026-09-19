import { createFileRoute } from "@tanstack/react-router";
import { WatchlistPage } from "@/components/knew/pages";
export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — Knew It" },
      { name: "description", content: "Track saved markets and assets." },
      { property: "og:title", content: "Watchlist — Knew It" },
      { property: "og:description", content: "Track saved markets and assets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchlistPage,
});
