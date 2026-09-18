import { createFileRoute } from "@tanstack/react-router";
import { MarketsPage } from "@/components/knew/pages";
export const Route = createFileRoute("/markets/")({
  head: () => ({
    meta: [
      { title: "Markets — Knew It" },
      {
        name: "description",
        content: "Browse prediction, crypto, memecoin, perpetual, and tokenized stock markets.",
      },
      { property: "og:title", content: "Markets — Knew It" },
      { property: "og:description", content: "Browse every market on Knew It." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketsPage,
});
