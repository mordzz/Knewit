import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/knew/pages";
export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Knew It" },
      {
        name: "description",
        content: "Review balances, allocation, positions, and portfolio activity.",
      },
      { property: "og:title", content: "Portfolio — Knew It" },
      { property: "og:description", content: "A unified portfolio across every Knew It market." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});
