import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/components/knew/sign-in";
export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — Knew It" },
      {
        name: "description",
        content: "Sign in to Knew It and access prediction markets and crypto trading.",
      },
      { property: "og:title", content: "Sign in — Knew It" },
      { property: "og:description", content: "Your next move starts here." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});
