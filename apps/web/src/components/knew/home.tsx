import {
  ArrowRight,
  BarChart3,
  Bookmark,
  ChevronRight,
  CircleDollarSign,
  Menu,
  MoveUpRight,
  Radio,
  TrendingUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const markets = [
  { question: "Will the Fed cut rates in September?", probability: 68, volume: "$8.4m", change: "+7.4" },
  { question: "Will Bitcoin trade above $150k this year?", probability: 57, volume: "$12.8m", change: "+3.2" },
  { question: "Will SpaceX reach Mars before 2030?", probability: 41, volume: "$5.1m", change: "−2.1" },
];

function Wordmark() {
  return (
    <Link to="/" aria-label="Knew It home" className="group inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-md bg-primary font-bold text-primary-foreground transition-transform group-hover:-rotate-3">
        K
      </span>
      <span className="text-[15px] font-semibold">Knew It</span>
    </Link>
  );
}

function MarketChart() {
  return (
    <svg viewBox="0 0 520 180" className="h-full w-full" role="img" aria-label="Demo probability chart trending upward">
      <path className="hero-chart-grid" d="M0 35H520M0 90H520M0 145H520" />
      <path className="hero-chart-fill" d="M0 151C41 143 65 118 99 122C136 126 157 80 198 87C238 93 261 71 296 76C329 80 350 48 387 57C430 67 454 25 520 17V180H0Z" />
      <path className="hero-chart-line" d="M0 151C41 143 65 118 99 122C136 126 157 80 198 87C238 93 261 71 296 76C329 80 350 48 387 57C430 67 454 25 520 17" />
      <circle className="hero-chart-dot" cx="520" cy="17" r="5" />
    </svg>
  );
}

export function HomePage() {
  return (
    <main className="premium-home min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-30 mx-auto flex h-[76px] w-full max-w-[1440px] items-center justify-between border-x border-border px-5 sm:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/markets" className="hover:text-foreground">Markets</Link>
          <Link to="/portfolio" className="hover:text-foreground">Portfolio</Link>
          <Link to="/watchlist" className="hover:text-foreground">Watchlist</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/sign-in">Sign in</Link>
          </Button>
          <Button asChild className="h-10 px-5">
            <Link to="/markets">Enter markets <ArrowRight /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
            <Menu />
          </Button>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 border-x border-t border-border lg:grid-cols-12">
        <div className="hero-copy relative z-10 flex flex-col justify-between border-b border-border px-5 py-10 sm:px-8 sm:py-14 lg:col-span-7 lg:min-h-[620px] lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
          <div>
            <div className="mb-10 flex items-center gap-2 font-mono text-[11px] uppercase text-muted-foreground">
              <Radio className="size-3.5 text-primary" />
              <span>Markets live</span>
              <span className="text-border-strong">/</span>
              <span>Demo prices</span>
            </div>
            <h1 className="max-w-[760px] font-display text-[clamp(4.75rem,10vw,9.5rem)] leading-[0.75]">
              Know it.
              <br />
              <em className="text-primary">Trade it.</em>
            </h1>
            <p className="mt-10 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
              One market for every possible future. Put conviction behind predictions, crypto,
              perps, memecoins, and tokenized stocks.
            </p>
          </div>

          <div className="mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <Button asChild size="lg" className="h-14 w-fit px-7 text-base">
              <Link to="/markets">Explore predictions <ArrowRight /></Link>
            </Button>
            <div className="flex gap-8 border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Live markets</p>
                <p className="mt-1 text-xl font-semibold">24</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">24h volume</p>
                <p className="mt-1 text-xl font-semibold">$31.6m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[650px] flex-col bg-card lg:col-span-5 lg:min-h-[620px]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
              <span className="size-1.5 rounded-full bg-positive" /> Featured market
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Add market to watchlist" className="text-muted-foreground hover:text-foreground">
              <Bookmark className="size-4" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col p-5 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <span className="font-mono text-[10px] uppercase text-primary">Macro · closes Sep 18</span>
                <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight sm:text-3xl">
                  Will the Federal Reserve cut rates in September?
                </h2>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                <CircleDollarSign className="size-5" />
              </span>
            </div>

            <div className="my-8 flex items-end justify-between border-y border-border py-5">
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Yes probability</p>
                <p className="mt-2 font-display text-7xl leading-none">68<span className="text-4xl text-primary">%</span></p>
              </div>
              <div className="mb-1 flex items-center gap-1 text-sm font-semibold text-positive">
                <TrendingUp className="size-4" /> 7.4%
              </div>
            </div>

            <div className="h-[180px] w-full"><MarketChart /></div>

            <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
              <Button asChild size="lg" className="h-14 justify-between px-5">
                <Link to="/markets/$marketId" params={{ marketId: "fed-rate-september" }}>
                  Buy Yes <span>68¢</span>
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-14 justify-between border border-border px-5">
                <Link to="/markets/$marketId" params={{ marketId: "fed-rate-september" }}>
                  Buy No <span>32¢</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="market-tape border-y border-border bg-primary text-primary-foreground" aria-label="Live market tape">
        <div className="mx-auto flex min-h-11 max-w-[1440px] items-center overflow-hidden border-x border-primary-foreground/20 font-mono text-[11px] uppercase">
          <span className="shrink-0 border-r border-primary-foreground/20 px-5 font-bold">Live pulse</span>
          <div className="flex min-w-max items-center">
            {markets.map((market) => (
              <span key={market.question} className="flex items-center gap-3 border-r border-primary-foreground/20 px-5">
                {market.question} <strong>{market.probability}%</strong> <span>{market.change}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] border-x border-border px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="font-mono text-[11px] uppercase text-primary">The world, priced live</p>
            <h2 className="mt-5 font-display text-5xl leading-[0.9] sm:text-7xl">Your edge starts with a question.</h2>
            <Button asChild variant="outline" className="mt-8 h-11">
              <Link to="/markets">View every market <MoveUpRight /></Link>
            </Button>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {markets.map((market, index) => (
              <Link
                key={market.question}
                to="/markets/$marketId"
                params={{ marketId: index === 0 ? "fed-rate-september" : index === 1 ? "bitcoin-150k" : "spacex-mars" }}
                className="group grid grid-cols-[1fr_auto] items-center gap-5 py-6 sm:grid-cols-[36px_1fr_auto_auto]"
              >
                <span className="hidden font-mono text-xs text-muted-foreground sm:block">0{index + 1}</span>
                <div>
                  <p className="font-medium group-hover:text-primary">{market.question}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{market.volume} volume · Demo</p>
                </div>
                <span className="font-display text-4xl">{market.probability}%</span>
                <ChevronRight className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 border-x border-t border-border px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
        <Wordmark />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BarChart3 className="size-4" /> Prediction markets first. Everything else, connected.
        </div>
      </footer>
    </main>
  );
}