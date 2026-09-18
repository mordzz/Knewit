import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "./app-shell";
import { assets, featuredPrediction, predictions } from "./data";
import {
  DemoBadge,
  EmptyState,
  FeaturedMarket,
  MarketTabs,
  PageTitle,
  PredictionCard,
  Stat,
} from "./market-ui";
import { Sparkline } from "./sparkline";
import { Button } from "@/components/ui/button";

export function DiscoverPage() {
  const [category, setCategory] = useState("All");
  const shown =
    category === "All"
      ? predictions.slice(1)
      : predictions.slice(1).filter((x) => x.category === category);
  return (
    <AppShell>
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-8">
        <div className="flex items-end justify-between gap-4">
          <PageTitle
            eyebrow="Prediction markets"
            title="Discover"
            description="Trade your view on what happens next."
          />
          <DemoBadge />
        </div>
        <div className="mt-6">
          <MarketTabs />
        </div>
        <div className="mt-6">
          <FeaturedMarket market={featuredPrediction} />
        </div>
        <section className="mt-9">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="font-display text-xl font-semibold">Trending predictions</h2>
            <Link
              to="/markets"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              View all
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-2">
            {["All", "Crypto", "Politics", "Sports", "Finance", "Culture"].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`h-9 shrink-0 rounded-full px-4 text-sm transition ${category === c ? "bg-primary font-semibold text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.length ? (
              shown.map((m) => <PredictionCard key={m.id} market={m} />)
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title={`No ${category.toLowerCase()} predictions yet`}
                  copy="Try another category or check back when new markets open."
                />
              </div>
            )}
          </div>
        </section>
        <section className="mt-10">
          <div>
            <h2 className="font-display text-xl font-semibold">Across the market</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crypto, memecoins, perps, and tokenized stocks.
            </p>
          </div>
          <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {assets.slice(0, 4).map((a, i) => (
              <AssetRow
                key={a.ticker}
                asset={a}
                points={predictions[i % predictions.length]?.points ?? featuredPrediction.points}
              />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
function AssetRow({ asset, points }: { asset: (typeof assets)[number]; points: number[] }) {
  return (
    <Link
      to="/markets"
      className="grid min-h-19 grid-cols-[minmax(0,1fr)_90px_auto] items-center gap-4 px-4 transition hover:bg-card-hover sm:grid-cols-[minmax(0,1fr)_130px_120px_auto]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-semibold">
          {asset.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{asset.name}</p>
          <p className="text-xs text-muted-foreground">
            {asset.ticker} · {asset.kind}
          </p>
        </div>
      </div>
      <div className="hidden sm:block">
        <Sparkline
          points={asset.trend ? points : [...points].reverse()}
          positive={asset.trend}
          height={36}
        />
      </div>
      <div className="text-right">
        <p className="tabular-nums text-sm font-medium">{asset.price}</p>
        <p className={`tabular-nums text-xs ${asset.trend ? "text-positive" : "text-negative"}`}>
          {asset.change}
        </p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
export function MarketsPage() {
  const [tab, setTab] = useState("Predictions");
  return (
    <AppShell>
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-8">
        <PageTitle
          title="Markets"
          description="One view across predictions, spot assets, perpetual futures, and tokenized stocks."
        />
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {["Predictions", "Crypto", "Memecoins", "Perps", "Stocks"].map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${tab === x ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-hidden focus:border-primary"
              placeholder={`Search ${tab.toLowerCase()}`}
            />
          </label>
          <Button variant="secondary" size="icon" aria-label="Filter">
            <SlidersHorizontal />
          </Button>
        </div>
        {tab === "Predictions" ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {predictions.map((m) => (
              <PredictionCard key={m.id} market={m} />
            ))}
          </div>
        ) : (
          <div className="mt-5 divide-y divide-border rounded-lg border border-border bg-card">
            {assets
              .filter((a) =>
                tab === "Stocks"
                  ? a.kind === "Tokenized stock"
                  : a.kind === tab.slice(0, -1) || a.kind === tab,
              )
              .map((a, i) => (
                <AssetRow
                  key={a.ticker}
                  asset={a}
                  points={predictions[i]?.points ?? featuredPrediction.points}
                />
              ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
export function PortfolioPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-7 sm:py-8">
        <div className="flex items-end justify-between">
          <PageTitle
            title="Portfolio"
            description="Your positions and balances across every market."
          />
          <DemoBadge />
        </div>
        <section className="mt-7 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3 sm:p-7">
          <Stat
            label="Total portfolio value"
            value="$24,680.42"
            change="+$1,240.18 · 5.29% this month"
          />
          <Stat label="Available balance" value="$12,840.20" />
          <Stat label="Open positions" value="$11,840.22" />
        </section>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Allocation</h2>
            <div className="mt-8 flex h-4 overflow-hidden rounded-full">
              <div className="w-[48%] bg-primary" />
              <div className="w-[27%] bg-positive" />
              <div className="w-[16%] bg-chart-3" />
              <div className="w-[9%] bg-muted-foreground" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Predictions", "48%"],
                ["Crypto", "27%"],
                ["Perps", "16%"],
                ["Tokenized stocks", "9%"],
              ].map((x) => (
                <div key={x[0]} className="flex justify-between">
                  <span className="text-muted-foreground">{x[0]}</span>
                  <span className="tabular-nums">{x[1]}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Recent activity</h2>
            <div className="mt-4 space-y-5">
              {[
                {
                  Icon: ArrowUpRight,
                  title: "Bought Yes",
                  sub: "Fed rate decision",
                  value: "$240.00",
                },
                {
                  Icon: ArrowDownLeft,
                  title: "Closed position",
                  sub: "BTC above $120K",
                  value: "+$84.20",
                },
              ].map(({ Icon, title, sub, value }) => (
                <div key={String(title)} className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-secondary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{String(title)}</p>
                    <p className="truncate text-xs text-muted-foreground">{String(sub)}</p>
                  </div>
                  <span className="text-sm tabular-nums">{String(value)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section className="mt-4 rounded-xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <h2 className="font-semibold">Open prediction positions</h2>
          </div>
          <div className="divide-y divide-border">
            {predictions.slice(0, 2).map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_auto] gap-4 p-5">
                <div>
                  <p className="text-sm font-medium">{m.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Yes · 420 shares</p>
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums">${(m.probability * 4.2).toFixed(2)}</p>
                  <p className="text-xs text-positive">+$32.40</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
export function ActivityPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-7 sm:py-8">
        <PageTitle title="Activity" description="Orders, trades, funding, and account history." />
        <div className="mt-7 rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1fr_auto] border-b border-border p-5">
            <h2 className="font-semibold">Recent activity</h2>
            <DemoBadge />
          </div>
          {[
            "Bought 420 Yes shares · Fed rate decision",
            "Deposited USD balance",
            "Closed BTC prediction position",
            "Opened SOL-PERP long · 2×",
          ].map((x, i) => (
            <div
              key={x}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-5 last:border-0"
            >
              <span className="grid size-9 place-items-center rounded-full bg-secondary">
                <Clock3 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{x}</p>
                <p className="mt-1 text-xs text-muted-foreground">Sep {18 - i}, 2026 · Completed</p>
              </div>
              <span className="text-sm tabular-nums">
                {i === 0 ? "$240.00" : i === 1 ? "$2,500.00" : i === 2 ? "+$84.20" : "$600.00"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
export function WatchlistPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-7 sm:py-8">
        <PageTitle title="Watchlist" description="Markets and assets you want to follow closely." />
        <div className="mt-7">
          <EmptyState
            title="Your watchlist is ready"
            copy="Save any prediction or asset to track its next move here."
          />
        </div>
      </div>
    </AppShell>
  );
}
