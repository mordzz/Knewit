import { Link } from "@tanstack/react-router";
import { Bookmark, Clock3, Eye, Info, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import electionImage from "@/assets/election-market.jpg";
import launchImage from "@/assets/launch-market.jpg";
import bitcoinImage from "@/assets/bitcoin-market.jpg";
import type { Prediction } from "./data";
import { Sparkline } from "./sparkline";

const images = { election: electionImage, launch: launchImage, bitcoin: bitcoinImage };

export function DemoBadge() {
  return (
    <span className="inline-flex rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
      Demo data
    </span>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0">
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase text-primary">{eyebrow}</p>}
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
export function MarketTabs({ active = "Predictions" }: { active?: string }) {
  return (
    <div
      className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border"
      role="tablist"
    >
      {["Predictions", "Crypto", "Memecoins", "Perps", "Stocks"].map((x) => (
        <Link
          key={x}
          to={x === "Predictions" ? "/" : "/markets"}
          className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${active === x ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          {x}
        </Link>
      ))}
    </div>
  );
}
export function FeaturedMarket({ market }: { market: Prediction }) {
  const [saved, setSaved] = useState(false);
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative min-h-60 overflow-hidden lg:min-h-96">
          <img
            src={images[market.image as keyof typeof images]}
            alt="Illustrative market scene"
            className="absolute inset-0 h-full w-full object-cover"
            width={1024}
            height={640}
          />
          <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-card" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <DemoBadge />
            <span className="rounded-sm bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur">
              Featured
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-medium text-primary">{market.category}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSaved(!saved)}
              aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Bookmark className={saved ? "fill-primary text-primary" : ""} />
            </Button>
          </div>
          <Link to="/markets/$marketId" params={{ marketId: market.id }}>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-tight hover:text-primary sm:text-3xl">
              {market.question}
            </h2>
          </Link>
          <div className="mt-6 grid grid-cols-[auto_1fr] items-end gap-6">
            <div>
              <p className="text-4xl font-semibold tabular-nums">{market.probability}%</p>
              <p className="mt-1 text-xs text-muted-foreground">chance</p>
            </div>
            <Sparkline points={market.points} />
          </div>
          <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="size-3.5" />
              {market.volume} volume
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" />
              Ends {market.ends}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button asChild>
              <Link to="/markets/$marketId" params={{ marketId: market.id }}>
                Yes · {market.probability}¢
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/markets/$marketId" params={{ marketId: market.id }}>
                No · {100 - market.probability}¢
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
export function PredictionCard({ market }: { market: Prediction }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="group flex h-full flex-col rounded-lg border border-border bg-card p-4 transition duration-200 hover:border-border-strong hover:bg-card-hover">
      <div className="flex gap-3">
        <img
          src={images[market.image as keyof typeof images]}
          alt=""
          loading="lazy"
          className="size-12 shrink-0 rounded-md object-cover"
          width={96}
          height={96}
        />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{market.category}</span>
            <button
              onClick={() => setSaved(!saved)}
              className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Toggle watchlist"
            >
              <Bookmark className={`size-4 ${saved ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>
          <Link
            to="/markets/$marketId"
            params={{ marketId: market.id }}
            className="mt-1 block text-sm font-semibold leading-5 hover:text-primary"
          >
            {market.question}
          </Link>
        </div>
      </div>
      {market.multi ? (
        <div className="mt-5 space-y-2">
          {market.multi.map((x) => (
            <div key={x.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="h-8 overflow-hidden rounded-md bg-secondary">
                <div
                  className="h-full bg-accent px-2 text-xs leading-8"
                  style={{ width: `${Math.max(x.value * 2.6, 35)}%` }}
                >
                  {x.label}
                </div>
              </div>
              <span className="tabular-nums text-sm font-semibold">{x.value}%</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-[auto_1fr] items-end gap-4">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{market.probability}%</p>
              <p
                className={`mt-1 text-xs ${market.change > 0 ? "text-positive" : "text-negative"}`}
              >
                {market.change > 0 ? "+" : ""}
                {market.change}%
              </p>
            </div>
            <Sparkline points={market.points} positive={market.change > 0} height={48} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm">Yes {market.probability}¢</Button>
            <Button size="sm" variant="secondary">
              No {100 - market.probability}¢
            </Button>
          </div>
        </>
      )}
      <div className="mt-auto flex justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span>{market.volume} vol.</span>
        <span>Ends {market.ends}</span>
      </div>
    </article>
  );
}
export function Stat({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {change && <p className="mt-1 text-xs text-positive">{change}</p>}
    </div>
  );
}
export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Eye className="size-5" />
      </span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{copy}</p>
      <Button asChild className="mt-5">
        <Link to="/">Explore predictions</Link>
      </Button>
    </div>
  );
}
export function InfoLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      {children}
    </div>
  );
}
