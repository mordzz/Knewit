import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/knew/landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Knew It — Trade What Happens Next" },
      {
        name: "description",
        content: "Trade predictions, crypto, memecoins, perps, and tokenized stocks in one app.",
      },
      { property: "og:title", content: "Knew It — Trade What Happens Next" },
      {
        property: "og:description",
        content: "Trade predictions, crypto, memecoins, perps, and tokenized stocks in one app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <LandingPage />;
}
