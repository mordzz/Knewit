'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bitcoin,
  BatteryFull,
  ChevronDown,
  Globe2,
  SignalHigh,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
  Wifi,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { FOCUS, LandingHeader, PRIMARY_BUTTON } from '@/features/landing/components/LandingHeader';
import { LandingFooter } from '@/features/landing/components/LandingFooter';

const CTA_YELLOW = cn(
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-landing-yellow px-6 py-3 text-sm font-semibold text-landing-ink',
  'transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[oklch(.95_.19_99)]',
  FOCUS
);

const marketViews = [
  {
    name: 'Predictions',
    title: 'Will Bitcoin reach $150,000 this year?',
    description: 'Take a position on events across crypto, politics, sports, and culture.',
    value: '67%',
    unit: 'chance',
    yes: 'Yes',
    no: 'No',
    icon: Globe2,
  },
  {
    name: 'Crypto',
    title: 'Bitcoin',
    description: 'Follow the assets you care about without losing the wider market context.',
    value: '$98,420',
    unit: 'BTC / USD',
    yes: 'Up',
    no: 'Down',
    icon: Bitcoin,
  },
  {
    name: 'Perps',
    title: 'BTC perpetual',
    description: 'See both sides of the market and move when your conviction is clear.',
    value: '$98,450',
    unit: 'mark price',
    yes: 'Long',
    no: 'Short',
    icon: Zap,
  },
  {
    name: 'Stocks',
    title: 'NVIDIA',
    description: 'Keep familiar companies alongside the rest of the markets you follow.',
    value: '$182.64',
    unit: 'token price',
    yes: 'Buy',
    no: 'Watch',
    icon: BarChart3,
  },
];

const faqs = [
  {
    question: 'What is Knew It?',
    answer:
      'Knewit brings Polymarket prediction markets together with a community for sharing position-backed Callouts. Browse markets, manage supported positions, and follow public trader rankings.',
  },
  {
    question: 'Can I trade with real money yet?',
    answer:
      'Knewit includes a Polymarket trading flow for eligible, configured accounts, but end-to-end execution has not yet been verified. Trading depends on wallet setup, funding, market availability, and Polymarket eligibility.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'A native mobile app is in development, and public App Store and Google Play downloads are not available yet. The web app is available today.',
  },
  {
    question: 'What are prediction markets?',
    answer:
      'Prediction markets let people take positions on the outcome of an event. Prices reflect the market’s view of its likelihood and can change as new information arrives.',
  },
];

function Chart({ className, yellow = false }: { className?: string; yellow?: boolean }) {
  return (
    <svg className={cn('block h-auto w-full', className)} viewBox="0 0 360 130" fill="none" aria-hidden="true">
      <path className="stroke-1 stroke-current opacity-10 [stroke-dasharray:3_5]" d="M0 25H360M0 65H360M0 105H360" />
      <path
        className={yellow ? 'fill-landing-yellow/10' : 'fill-[oklch(.74_.14_157/.1)]'}
        d="M0 110L17 101L29 108L48 81L62 85L79 72L95 89L109 78L124 82L139 57L155 65L170 43L186 54L202 48L219 64L236 39L248 45L267 23L280 34L297 14L312 26L329 18L343 29L360 9V130H0Z"
      />
      <path
        className={cn(
          'stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]',
          yellow ? 'stroke-landing-yellow' : 'stroke-[oklch(.54_.14_157)]'
        )}
        d="M0 110L17 101L29 108L48 81L62 85L79 72L95 89L109 78L124 82L139 57L155 65L170 43L186 54L202 48L219 64L236 39L248 45L267 23L280 34L297 14L312 26L329 18L343 29L360 9"
      />
    </svg>
  );
}

function PhoneMockup({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div
      className={cn(
        'absolute w-[304px] overflow-hidden rounded-[38px] border-[7px] border-landing-ink bg-black',
        'shadow-[0_24px_60px_oklch(.28_.08_90/.24),0_5px_0_oklch(.33_.02_83)]',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="relative flex h-8 items-center justify-between rounded-t-[31px] bg-[#08090c] px-3 text-white"
      >
        <span className="text-[10px] font-semibold leading-none tracking-[0.01em]">9:41</span>
        <span className="absolute left-1/2 top-1/2 grid h-[19px] w-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black">
          <span className="mr-[-40px] size-[6px] rounded-full bg-[#111318] ring-1 ring-white/5" />
        </span>
        <span className="flex items-center gap-[3px]">
          <SignalHigh size={13} strokeWidth={2.2} />
          <Wifi size={13} strokeWidth={2.2} />
          <span className="text-[9px] font-semibold leading-none">100%</span>
          <BatteryFull size={16} strokeWidth={2} />
        </span>
      </div>
      <div className="px-[7px] pb-[7px]">
        <Image
          src={src}
          alt={alt}
          width={393}
          height={852}
          sizes="276px"
          className="block h-auto w-full rounded-b-[24px]"
        />
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative h-[670px] w-[580px] shrink-0 max-[1280px]:origin-top max-[1280px]:scale-[.9] max-[1100px]:scale-[.78] max-[900px]:mb-[-65px] max-[640px]:mb-[-190px] max-[640px]:mt-[-45px] max-[640px]:scale-[.62] max-[380px]:mb-[-220px] max-[380px]:scale-[.55]">
      <div className="absolute inset-x-10 bottom-12 h-20 rounded-full bg-[oklch(.48_.08_85/.18)] blur-2xl" aria-hidden="true" />
      <PhoneMockup
        src="/mockup1.png"
        alt="Knewit mobile Callouts feed showing position-backed community posts"
        className="left-[21px] top-[100px] z-[1] rotate-[-4deg] opacity-95"
      />
      <PhoneMockup
        src="/mockup2.png"
        alt="Knewit mobile Markets screen showing market categories and outcomes"
        className="left-[251px] top-6 z-[2] rotate-[3deg]"
      />
      <div className="absolute bottom-12 left-1/2 z-[3] -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-landing-ink/10 bg-landing-paper px-4 py-3 shadow-[0_16px_35px_oklch(.38_.08_93/.18)]">
        <span className="grid size-9 place-items-center rounded-xl bg-landing-yellow">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="text-[11px] font-semibold">One account. One view.</p>
          <p className="mt-0.5 text-[8px] text-landing-muted">Markets, positions, and calls.</p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [activeMarket, setActiveMarket] = useState(0);
  const market = marketViews[activeMarket] ?? marketViews[0]!;

  return (
    <div className="overflow-clip bg-landing-paper font-sans leading-normal text-landing-ink [-webkit-tap-highlight-color:transparent] selection:bg-landing-ink selection:text-landing-yellow">
      <a
        href="#main-content"
        className={cn('absolute -top-24 left-4 z-[100] rounded-lg bg-landing-paper px-4 py-3 focus:top-4', FOCUS)}
      >
        Skip to content
      </a>

      <LandingHeader />

      <div className="bg-landing-yellow">
        <main id="main-content">
          <section className="mx-auto grid min-h-[calc(100svh-145px)] min-w-0 max-w-[1300px] grid-cols-[1.05fr_.95fr] items-center gap-12 px-6 pb-16 pt-8 lg:px-10 max-[900px]:grid-cols-1 max-[900px]:pb-10 max-[900px]:pt-14 max-[900px]:text-center">
            <div className="relative z-10 min-w-0 motion-safe:animate-ki-rise">
              <h1 className="text-[clamp(3.5rem,5.2vw,4.75rem)] font-bold leading-[.96] tracking-[-0.04em] max-[900px]:mx-auto max-[640px]:text-[clamp(3rem,15vw,4.15rem)]">
                <span className="whitespace-nowrap max-[640px]:whitespace-normal">See the market.</span>
                <br />
                <span className="whitespace-nowrap max-[640px]:whitespace-normal">Back your take.</span>
              </h1>
              <p className="mt-7 max-w-[560px] text-pretty text-lg leading-8 text-[oklch(.35_.035_83)] max-[900px]:mx-auto max-[640px]:text-base max-[640px]:leading-7">
                Discover live markets, take a position, and share the call with people who see what you see.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5 max-[900px]:justify-center">
                <Link href="/sign-in" className={PRIMARY_BUTTON}>
                  Explore Knew it <ArrowUpRight size={18} />
                </Link>
                <a href="#how-it-works" className={cn('group inline-flex items-center gap-2 text-sm font-semibold', FOCUS)}>
                  See how it works
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
              <p className="mt-5 text-xs text-[oklch(.4_.035_83)]">Continue with email, Google, or X.</p>
            </div>
            <div className="flex min-w-0 justify-center motion-safe:animate-ki-rise-slow max-[900px]:w-full max-[900px]:text-left">
              <ProductPreview />
            </div>
          </section>
        </main>

        <div className="border-t border-landing-ink/15">
          <div
            className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 overflow-x-auto px-6 py-5 text-xs font-semibold [scrollbar-width:none] lg:px-10"
            aria-label="Markets to explore"
          >
            <span className="flex shrink-0 items-center gap-2"><Globe2 size={16} /> Prediction markets</span>
            <span className="flex shrink-0 items-center gap-2"><Bitcoin size={16} /> Crypto</span>
            <span className="flex shrink-0 items-center gap-2"><Zap size={16} /> Perpetuals</span>
            <span className="flex shrink-0 items-center gap-2"><BarChart3 size={16} /> Tokenized stocks</span>
            <span className="flex shrink-0 items-center gap-2"><Users size={16} /> Social callouts</span>
          </div>
        </div>
      </div>

      <section id="markets" className="scroll-mt-20 px-6 py-[105px] lg:px-12 max-[801px]:px-6 max-[801px]:py-[70px] max-[581px]:px-5 max-[581px]:py-[58px]" aria-labelledby="ki-markets-title">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="text-center">
            <h2 id="ki-markets-title" className="mx-auto max-w-[680px] text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.035em] max-[581px]:text-[40px]">
              Markets with the decision already attached.
            </h2>
            <p className="mx-auto mt-5 max-w-[460px] text-sm leading-6 text-landing-muted">
              See the question, the price, the probability, and the next action in one place. No category page, chart, and trade screen split apart.
            </p>
          </div>

          <div
            className="mx-auto mb-[30px] mt-[38px] flex w-fit gap-2 rounded-full border border-[oklch(.91_.008_90)] bg-[oklch(.945_.008_90)] p-[6px] max-[581px]:mt-7 max-[581px]:w-full max-[581px]:justify-between max-[581px]:gap-[2px] max-[581px]:p-[5px]"
            role="tablist"
            aria-label="Explore market types"
          >
            {marketViews.map((view, index) => (
              <button
                key={view.name}
                id={`market-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={activeMarket === index}
                aria-controls="market-preview"
                tabIndex={activeMarket === index ? 0 : -1}
                className={cn(
                  'flex cursor-pointer items-center justify-center gap-[9px] rounded-full border-0 bg-transparent px-6 py-3 text-[12px] text-landing-muted aria-selected:bg-landing-ink aria-selected:text-landing-paper',
                  'max-[581px]:gap-[5px] max-[581px]:px-[11px] max-[581px]:py-[10px] max-[581px]:text-[10px] max-[581px]:[&_svg]:h-[13px] max-[581px]:[&_svg]:w-[13px] max-[361px]:px-[7px] max-[361px]:text-[9px]',
                  FOCUS
                )}
                onClick={() => setActiveMarket(index)}
                onKeyDown={(event) => {
                  let next = index;
                  if (event.key === 'ArrowRight') next = (index + 1) % marketViews.length;
                  else if (event.key === 'ArrowLeft') next = (index + marketViews.length - 1) % marketViews.length;
                  else if (event.key === 'Home') next = 0;
                  else if (event.key === 'End') next = marketViews.length - 1;
                  else return;
                  event.preventDefault();
                  setActiveMarket(next);
                  document.getElementById(`market-tab-${next}`)?.focus();
                }}
              >
                <view.icon size={18} />
                {view.name}
              </button>
            ))}
          </div>

          <div
            id="market-preview"
            role="tabpanel"
            aria-labelledby={`market-tab-${activeMarket}`}
            tabIndex={0}
            className={cn(
              'grid min-h-[435px] grid-cols-2 overflow-hidden rounded-[28px] bg-[oklch(.95_.027_95)] max-[581px]:grid-cols-1 max-[581px]:rounded-[22px]',
              FOCUS
            )}
          >
            <div className="self-center px-11 py-16 max-[1101px]:px-[30px] max-[1101px]:py-10 max-[801px]:px-[23px] max-[801px]:py-[30px] max-[581px]:px-[27px] max-[581px]:py-8">
              <h3 className="max-w-[420px] text-4xl font-semibold leading-[1.12] tracking-[-0.03em] max-[581px]:text-[32px]">
                {market.title}
              </h3>
              <p className="mt-4 max-w-[410px] text-sm leading-6 text-landing-muted">
                {market.description}
              </p>
              <Link href="/sign-in" className={cn('group mt-7 inline-flex items-center gap-2 text-sm font-semibold', FOCUS)}>
                Explore this market <ArrowUpRight size={19} className="transition-transform duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[3px]" />
              </Link>
            </div>
            <div className="relative isolate grid place-items-center bg-[oklch(.925_.045_95)] px-[45px] py-10 max-[1101px]:px-[28px] max-[1101px]:py-[35px] max-[801px]:px-5 max-[801px]:py-[30px] max-[581px]:px-10 max-[581px]:pb-[37px] max-[581px]:pt-[30px] max-[361px]:p-[25px]">
              <div className="w-full max-w-[360px] rotate-[3deg] rounded-[19px] border border-[oklch(.9_.01_90)] bg-[oklch(.998_0_0)] p-6 text-landing-ink shadow-[0_20px_30px_oklch(.4_.03_90/.07)] max-[801px]:p-[18px] max-[581px]:p-[22px]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-landing-muted">Live market preview</p>
                    <p className="mt-2 text-xl font-semibold">{market.title}</p>
                  </div>
                  <span className="rounded-full border border-landing-ink/10 px-3 py-1 text-xs text-landing-muted">Illustrative</span>
                </div>
                <div className="mt-10 flex items-end justify-between gap-6">
                  <div>
                    <strong className="block text-5xl tracking-[-0.04em]">{market.value}</strong>
                    <span className="mt-1 block text-xs text-landing-muted">{market.unit}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-[oklch(.45_.12_155)]"><TrendingUp size={14} /> Updating</span>
                </div>
                <Chart className="mt-7" />
                <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm font-semibold">
                  <span className="rounded-xl bg-[oklch(.89_.09_155)] px-4 py-3 text-[oklch(.3_.1_155)]">{market.yes}</span>
                  <span className="rounded-xl bg-[oklch(.92_.04_24)] px-4 py-3 text-[oklch(.43_.13_24)]">{market.no}</span>
                </div>
              </div>
              <span
                className="absolute bottom-[5px] left-[6px] -z-10 text-[100px] leading-none text-[oklch(.66_.09_92)]"
                aria-hidden="true"
              >
                ✳
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-[oklch(.956_.008_90)]" aria-labelledby="ki-experience-title">
        <div className="mx-auto max-w-[1240px] px-12 py-[105px] max-[1101px]:px-8 max-[1101px]:py-20 max-[801px]:px-6 max-[801px]:py-[70px] max-[581px]:px-5 max-[581px]:py-[58px]">
          <div className="mb-9 flex items-end justify-between gap-[30px] max-[801px]:block">
            <div>
              <span className="inline-flex items-center gap-[9px] text-[10px] font-semibold tracking-[1.5px] max-[581px]:text-[8px] max-[581px]:tracking-[1px]">
                LESS SWITCHING. MORE EXPLORING.
              </span>
              <h2
                id="ki-experience-title"
                className="my-[19px] mb-0 text-[44px] font-semibold leading-[1.07] tracking-[-2px] max-[1101px]:text-[38px] max-[801px]:text-[38px] max-[581px]:text-[33px]"
              >
                Big-picture thinking.
                <br />
                Pocket-size feeling.
              </h2>
            </div>
            <p className="max-w-[290px] text-[12px] leading-[1.8] text-landing-muted max-[801px]:mt-5">
              A trading experience that feels familiar.
              <br />
              Made for the way you see the world.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-[18px] max-[801px]:gap-3 max-[581px]:grid-cols-1 max-[581px]:gap-4">
            <article className="min-h-[397px] overflow-hidden rounded-[23px] bg-[oklch(.92_.14_100)] px-[27px] pt-[30px] max-[1101px]:px-[22px] max-[1101px]:pt-[27px] max-[801px]:min-h-[380px] max-[801px]:px-[18px] max-[801px]:pt-6 max-[581px]:min-h-[345px] max-[581px]:px-[27px] max-[581px]:pt-7">
              <div className="text-[8px] font-semibold tracking-[1px] opacity-65">01 / DISCOVER</div>
              <h3 className="mb-[14px] mt-[25px] text-[28px] font-semibold leading-[1.13] tracking-[-1.2px] max-[1101px]:text-[25px] max-[801px]:text-[22px] max-[581px]:text-[30px]">
                Start with
                <br />
                Trending.
              </h3>
              <p className="max-w-[240px] text-[12px] leading-[1.8] text-[oklch(.39_.025_83)] max-[801px]:text-[11px] max-[581px]:max-w-[280px] max-[581px]:text-[12px]">
                Browse markets by category, from Politics and Sports to Crypto and Culture.
              </p>
              <div className="-mx-3 mt-[33px] flex rotate-[-8deg] flex-wrap gap-[9px] max-[801px]:mt-[25px] max-[801px]:gap-[6px] max-[581px]:mx-auto max-[581px]:mb-[30px] max-[581px]:mt-7 max-[581px]:max-w-[330px] [&>span]:rounded-[40px] [&>span]:bg-[oklch(.995_.003_90)] [&>span]:px-[13px] [&>span]:py-[10px] [&>span]:text-[12px] [&>span]:font-medium [&>span]:shadow-[0_3px_4px_oklch(.5_.05_90/.04)] max-[801px]:[&>span]:px-[10px] max-[801px]:[&>span]:py-2 max-[801px]:[&>span]:text-[10px] max-[581px]:[&>span]:px-[13px] max-[581px]:[&>span]:py-[10px] max-[581px]:[&>span]:text-[12px]">
                <span>Trending</span>
                <span>Politics</span>
                <span>Sports</span>
                <span>Crypto</span>
                <span>Economics</span>
                <span>Technology</span>
                <span>Culture</span>
              </div>
            </article>
            <article className="min-h-[397px] overflow-hidden rounded-[23px] bg-[oklch(.89_.045_299)] px-[27px] pt-[30px] max-[1101px]:px-[22px] max-[1101px]:pt-[27px] max-[801px]:min-h-[380px] max-[801px]:px-[18px] max-[801px]:pt-6 max-[581px]:min-h-[345px] max-[581px]:px-[27px] max-[581px]:pt-7">
              <div className="text-[8px] font-semibold tracking-[1px] opacity-65">02 / GET THE PICTURE</div>
              <h3 className="mb-[14px] mt-[25px] text-[28px] font-semibold leading-[1.13] tracking-[-1.2px] max-[1101px]:text-[25px] max-[801px]:text-[22px] max-[581px]:text-[30px]">
                Less noise.
                <br />
                More perspective.
              </h3>
              <p className="max-w-[240px] text-[12px] leading-[1.8] text-[oklch(.39_.025_83)] max-[801px]:text-[11px] max-[581px]:max-w-[280px] max-[581px]:text-[12px]">
                Charts, probabilities, and prices. The context for your next move.
              </p>
              <div className="relative mt-[29px] rounded-[17px_17px_0_0] bg-[oklch(.995_.003_90)] p-5 max-[581px]:mx-auto max-[581px]:mb-0 max-[581px]:mt-[25px] max-[581px]:max-w-[300px]">
                <div className="flex items-center justify-between text-[9px]">
                  <span>Bitcoin prediction</span>
                  <strong className="text-[29px] tracking-[-1px]">
                    67<span className="text-[15px]">%</span>
                  </strong>
                </div>
                <Chart className="h-[70px]" />
                <span className="text-[7px] text-landing-muted">Illustrative probability</span>
              </div>
            </article>
            <article className="min-h-[397px] overflow-hidden rounded-[23px] bg-[oklch(.9_.054_46)] px-[27px] pt-[30px] max-[1101px]:px-[22px] max-[1101px]:pt-[27px] max-[801px]:min-h-[380px] max-[801px]:px-[18px] max-[801px]:pt-6 max-[581px]:min-h-[345px] max-[581px]:px-[27px] max-[581px]:pt-7">
              <div className="text-[8px] font-semibold tracking-[1px] opacity-65">03 / KEEP IT TOGETHER</div>
              <h3 className="mb-[14px] mt-[25px] text-[28px] font-semibold leading-[1.13] tracking-[-1.2px] max-[1101px]:text-[25px] max-[801px]:text-[22px] max-[581px]:text-[30px]">
                Wallet &amp;
                <br />
                Portfolio.
              </h3>
              <p className="max-w-[240px] text-[12px] leading-[1.8] text-[oklch(.39_.025_83)] max-[801px]:text-[11px] max-[581px]:max-w-[280px] max-[581px]:text-[12px]">
                Balance, deposits, and open positions with unrealized PnL, together in one place.
              </p>
              <div className="mt-[30px] rotate-[-5deg] max-[581px]:mx-auto max-[581px]:mb-[-10px] max-[581px]:mt-[25px] max-[581px]:max-w-[300px] [&>span]:mt-[7px] [&>span]:flex [&>span]:items-center [&>span]:gap-[10px] [&>span]:rounded-[10px] [&>span]:bg-[oklch(.995_.003_90)] [&>span]:p-[14px] [&>span]:text-[11px] [&>span]:font-medium [&>span]:shadow-[0_4px_10px_oklch(.4_.03_90/.05)] max-[801px]:[&>span]:gap-[6px] max-[801px]:[&>span]:px-[9px] max-[801px]:[&>span]:py-3 max-[801px]:[&>span]:text-[9px] max-[581px]:[&>span]:p-[15px] max-[581px]:[&>span]:text-[12px] [&>span_svg:last-child]:ml-auto">
                <span>
                  <WalletCards size={19} /> Balance <ArrowUpRight size={16} />
                </span>
                <span>
                  <BarChart3 size={19} /> Open positions <ArrowUpRight size={16} />
                </span>
                <span>
                  <TrendingUp size={19} /> Unrealized PnL <ArrowUpRight size={16} />
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto grid max-w-[1240px] scroll-mt-20 grid-cols-[1fr_1.2fr] gap-[65px] px-12 py-[105px] max-[1101px]:px-8 max-[1101px]:py-20 max-[801px]:grid-cols-[1fr_1.3fr] max-[801px]:gap-[25px] max-[801px]:px-6 max-[801px]:py-[70px] max-[581px]:grid-cols-1 max-[581px]:gap-[30px] max-[581px]:px-5 max-[581px]:py-[58px]"
        aria-labelledby="ki-faq-title"
      >
        <div>
          <span className="inline-flex items-center gap-[9px] text-[10px] font-semibold tracking-[1.5px] max-[581px]:text-[8px] max-[581px]:tracking-[1px]">
            GOOD QUESTIONS.
          </span>
          <h2
            id="ki-faq-title"
            className="my-[19px] text-[43px] font-semibold leading-[1.07] tracking-[-2px] max-[801px]:text-[33px] max-[581px]:text-[35px]"
          >
            Glad you asked.
          </h2>
          <p className="text-[14px] leading-[1.8] text-landing-muted">A little context before your next move.</p>
        </div>
        <div>
          {faqs.map((item, index) => (
            <details key={item.question} id={`faq-item-${index}`} className="group scroll-mt-24 border-b border-[oklch(.88_.008_90)] py-[22px] first:pt-0">
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-medium max-[581px]:text-[13px] [&::-webkit-details-marker]:hidden',
                  FOCUS
                )}
              >
                {item.question}
                <ChevronDown size={20} className="transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="pr-8 pt-[15px] text-[12px] leading-[1.85] text-landing-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-landing-paper px-6 pb-20 lg:px-10 max-[640px]:pb-12" aria-labelledby="closing-title">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-10 rounded-3xl bg-landing-ink px-12 py-14 text-landing-paper max-[760px]:block max-[640px]:px-7 max-[640px]:py-10">
          <div>
            <h2 id="closing-title" className="max-w-[680px] text-balance text-5xl font-semibold leading-[1.03] tracking-[-0.035em] max-[640px]:text-[40px]">
              Ready to put your view on the market?
            </h2>
            <p className="mt-4 max-w-[520px] text-sm leading-6 text-white/55">Sign in or get the mobile app when it ships. The web app works today.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 max-[760px]:mt-7">
            <Link href="/sign-in" className={CTA_YELLOW}>
              Explore Knew it <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
      {/*
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-8">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-white/45">Markets, positions, and calls in one place.</p>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-white/65" aria-label="Footer navigation">
            <a className={cn('hover:text-white', FOCUS)} href="#markets">Markets</a>
            <a className={cn('hover:text-white', FOCUS)} href="#how-it-works">How it works</a>
            <a className={cn('hover:text-white', FOCUS)} href="#faq">FAQ</a>
            <Link className={cn('hover:text-white', FOCUS)} href="/download">Download</Link>
            <Link className={cn('hover:text-white', FOCUS)} href="/privacy">Privacy</Link>
            <Link className={cn('hover:text-white', FOCUS)} href="/terms">Terms</Link>
            <Link className={cn('hover:text-white', FOCUS)} href="/support">Support</Link>
          </nav>
          <div className="flex w-full justify-between border-t border-white/10 pt-6 text-[11px] text-white/35 max-[640px]:flex-col max-[640px]:gap-2">
            <span>© {new Date().getFullYear()} Knew it</span>
            <span>Trading involves risk. Product previews use illustrative data.</span>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
