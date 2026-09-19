import { createFileRoute } from "@tanstack/react-router";
import { ActivityPage } from "@/components/knew/pages";
export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Knew It" },
      { name: "description", content: "Review order, trade, funding, and account activity." },
      { property: "og:title", content: "Activity — Knew It" },
      { property: "og:description", content: "Review activity across your Knew It account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityPage,
});
