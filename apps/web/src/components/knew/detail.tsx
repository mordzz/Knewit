import { useMemo, useState } from "react";
import { ArrowLeft, Bookmark, Clock3 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "./app-shell";
import { featuredPrediction, predictions } from "./data";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoBadge, InfoLine } from "./market-ui";

export function MarketDetailPage({ marketId }: { marketId: string }) {
  const market = predictions.find((x) => x.id === marketId) ?? featuredPrediction;
  const [range, setRange] = useState("1M");
  const data = useMemo(
    () => market.points.map((v, i) => ({ label: `${i + 1}`, value: v })),
    [market],
  );
  return (
    <AppShell>
      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-7 sm:py-8">
        <Link
          to="/markets"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Markets
        </Link>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">{market.category}</span>
                    <DemoBadge />
                  </div>
                  <h1 className="mt-3 max-w-3xl font-display text-2xl font-semibold leading-tight sm:text-3xl">
                    {market.question}
                  </h1>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" />
                      Closes {market.ends}
                    </span>
                    <span>{market.volume} volume</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Add to watchlist">
                  <Bookmark />
                </Button>
              </div>
              <div className="mt-8 flex items-end gap-3">
                <span className="text-4xl font-semibold tabular-nums">{market.probability}%</span>
                <span className="mb-1 text-sm text-positive">+{Math.abs(market.change)}%</span>
              </div>
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="detail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--primary)" stopOpacity={0.28} />
                        <stop offset="1" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" hide />
                    <YAxis
                      domain={[20, 80]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                      formatter={(v) => [`${v}%`, "Probability"]}
                    />
                    <Area
                      dataKey="value"
                      type="monotone"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#detail)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-end gap-1">
                {["1D", "1W", "1M", "ALL"].map((x) => (
                  <button
                    key={x}
                    onClick={() => setRange(x)}
                    className={`h-8 min-w-10 rounded-md text-xs font-medium ${range === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </section>
            <Tabs defaultValue="overview" className="mt-5">
              <TabsList className="border border-border bg-card">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold">Market context</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  This market tracks whether the stated event occurs before the closing date. Prices
                  reflect the market’s current implied probability, not a guaranteed forecast.
                </p>
              </TabsContent>
              <TabsContent
                value="activity"
                className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
              >
                Recent orders and fills will appear here when live market data is connected.
              </TabsContent>
              <TabsContent value="rules" className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold">Resolution</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  This demo market would resolve using the official announcement from the relevant
                  institution. Ambiguous or delayed outcomes would follow the platform’s published
                  resolution process.
                </p>
              </TabsContent>
            </Tabs>
          </div>
          <aside className="hidden xl:block">
            <OrderPanel probability={market.probability} />
          </aside>
        </div>
        <div className="fixed inset-x-4 bottom-20 z-20 xl:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="h-12 w-full shadow-xl">
                Trade this market
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <SheetHeader>
                <SheetTitle>Place order</SheetTitle>
                <SheetDescription>
                  Select an outcome and review the conditional payout.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5">
                <OrderPanel probability={market.probability} compact />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </AppShell>
  );
}
function OrderPanel({ probability, compact = false }: { probability: number; compact?: boolean }) {
  const [outcome, setOutcome] = useState<"Yes" | "No">("Yes");
  const [amount, setAmount] = useState("100");
  const price = outcome === "Yes" ? probability : 100 - probability;
  const payout = Number(amount || 0) / (price / 100);
  return (
    <div className={compact ? "" : "sticky top-24 rounded-xl border border-border bg-card p-5"}>
      <h2 className="font-semibold">Trade outcome</h2>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          variant={outcome === "Yes" ? "positive" : "secondary"}
          onClick={() => setOutcome("Yes")}
        >
          Yes · {probability}¢
        </Button>
        <Button
          variant={outcome === "No" ? "negative" : "secondary"}
          onClick={() => setOutcome("No")}
        >
          No · {100 - probability}¢
        </Button>
      </div>
      <label className="mt-5 block text-xs text-muted-foreground">Order amount</label>
      <div className="mt-2 flex h-12 items-center rounded-lg border border-border bg-secondary px-3 focus-within:border-primary">
        <span className="text-muted-foreground">$</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-lg font-semibold tabular-nums outline-hidden"
          aria-label="Order amount"
        />
        <span className="text-xs text-muted-foreground">USD</span>
      </div>
      <div className="mt-5 space-y-3 rounded-lg bg-secondary p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Share price</span>
          <span className="tabular-nums">{price}¢</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimated shares</span>
          <span className="tabular-nums">{payout.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 font-semibold">
          <span>Potential payout</span>
          <span className="tabular-nums">${payout.toFixed(2)}</span>
        </div>
      </div>
      <InfoLine>
        <span>
          Potential payout is conditional on <strong className="text-foreground">{outcome}</strong>{" "}
          winning. It is not guaranteed.
        </span>
      </InfoLine>
      <Button className="mt-5 h-11 w-full" disabled>
        Sign in to trade
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Demo order preview · No trade will be placed
      </p>
    </div>
  );
}
