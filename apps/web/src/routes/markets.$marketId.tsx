import { createFileRoute } from "@tanstack/react-router";
import { MarketDetailPage } from "@/components/knew/detail";
export const Route = createFileRoute("/markets/$marketId")({
  head: () => ({
    meta: [
      { title: "Prediction Market — Knew It" },
      {
        name: "description",
        content: "View probability, resolution details, and a conditional payout preview.",
      },
      { property: "og:title", content: "Prediction Market — Knew It" },
      { property: "og:description", content: "Follow and trade a prediction market on Knew It." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  const { marketId } = Route.useParams();
  return <MarketDetailPage marketId={marketId} />;
}
