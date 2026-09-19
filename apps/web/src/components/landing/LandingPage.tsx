'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bitcoin,
  ChevronDown,
  Globe2,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// Ported from `apps/dekstop/src/components/knew/landing.tsx`, restyled
// with Tailwind utilities only (the old `landing.css` is gone): palette
// and animations live in `globals.css`'s `@theme` (`bg-landing-paper`,
// `animate-ki-rise`, …), one-off pixel values are arbitrary utilities,
// and the original custom breakpoints (1450/1100/800/580/360px) are kept
// via `min-[…]:`/`max-[…]:` variants — the `max-[N+1px]` values are
// deliberate: Tailwind compiles `max-[Npx]` to `width < N`, while the old
// CSS `max-width:Npx` included N itself (e.g. a 360px-wide phone). Every
// primary CTA points at
// `/sign-in` (this app gates real markets behind auth). Landing pages use
// Plus Jakarta Sans, scoped to this component; the rest of the app keeps
// Inter.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const FOCUS =
  'focus-visible:outline-3 focus-visible:outline-[oklch(.5_.19_275)] focus-visible:outline-offset-[5px]';

const BUTTON_DARK = cn(
  'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-full bg-landing-ink font-semibold text-landing-paper',
  'transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_20px_oklch(.19_.014_83/.16)]',
  FOCUS
);

const TEXT_LINK = cn(
  'group inline-flex items-center gap-3 text-[13px] font-semibold max-[581px]:text-[11px]',
  FOCUS
);
const TEXT_LINK_ICON = 'transition-transform duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[3px]';

const EYEBROW =
  'inline-flex items-center gap-[9px] text-[10px] font-semibold tracking-[1.5px] max-[581px]:text-[8px] max-[581px]:tracking-[1px]';

const SECTION =
  'mx-auto max-w-[1240px] px-12 py-[105px] max-[1101px]:px-8 max-[1101px]:py-20 max-[801px]:px-6 max-[801px]:py-[70px] max-[581px]:px-5 max-[581px]:py-[58px]';

const SECTION_H2 =
  'my-[19px] text-[57px] font-semibold leading-[1.07] tracking-[-3px] max-[801px]:text-[45px] max-[801px]:tracking-[-2px] max-[581px]:text-[39px] max-[581px]:tracking-[-1.8px]';

const marketViews = [
  {
    name: 'Predictions',
    eyebrow: 'A LITTLE CONVICTION GOES A LONG WAY',
    title: 'See it coming?',
    accent: 'Take a position.',
    description:
      'Sports, culture, politics, and the next big headline. Explore prediction markets and put your perspective into play.',
    question: 'Will Bitcoin hit $150,000 this year?',
    value: '67%',
    unit: 'chance',
    icon: Globe2,
  },
  {
    name: 'Crypto',
    eyebrow: 'FROM THE BIG NAMES TO THE NEXT BIG THING',
    title: 'Find your',
    accent: 'next obsession.',
    description: 'From Bitcoin to the memecoin in your group chat. Discover crypto markets in one familiar interface.',
    question: 'Bitcoin',
    value: '$98,420',
    unit: 'BTC / USD',
    icon: Bitcoin,
  },
  {
    name: 'Perps',
    eyebrow: 'A VIEW IN EITHER DIRECTION',
    title: 'Up or down.',
    accent: 'Your call.',
    description:
      'Explore long and short positions with a clear view of the market. Keep price action and your next move together.',
    question: 'BTC perpetual',
    value: '$98,450',
    unit: 'mark price',
    icon: Zap,
  },
  {
    name: 'Stocks',
    eyebrow: 'BIG IDEAS. FAMILIAR COMPANIES.',
    title: 'Think beyond',
    accent: 'the ticker.',
    description: 'Discover tokenized stock markets alongside crypto and predictions. Different markets, one place to explore.',
    question: 'NVIDIA',
    value: '$182.64',
    unit: 'token price',
    icon: BarChart3,
  },
];

const faqs = [
  {
    q: 'What is Knew It?',
    a: 'Knew It brings prediction markets, crypto, memecoins, perpetual futures, and tokenized stocks into one product experience. Sign up, or try it instantly in guest mode — no wallet required to start.',
  },
  {
    q: 'Can I trade with real money yet?',
    a: 'Yes. Sign in and we automatically set up a secure embedded wallet so you can deposit and trade real markets. Prefer to look around first? Guest mode lets you explore with simulated trades — no wallet or sign-up needed.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'A mobile app is in the works. For now, the full experience — including guest mode — is available right here on web, on your phone or desktop.',
  },
  {
    q: 'What are prediction markets?',
    a: "Prediction markets let people take positions on the outcome of an event. Prices reflect the market's view of its likelihood and can change as new information arrives.",
  },
];

function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-[10px] whitespace-nowrap font-bold tracking-[-1.7px]',
        footer ? 'text-[25px]' : 'text-[29px] max-[581px]:text-[25px]',
        FOCUS
      )}
      aria-label="Knew It home"
    >
      <span
        className={cn(
          'relative block rotate-[-5deg] rounded-[11px] border-2 border-current',
          footer ? 'h-[35px] w-[35px]' : 'h-[37px] w-[37px] max-[581px]:h-[34px] max-[581px]:w-[34px]'
        )}
        aria-hidden="true"
      >
        <i className="absolute left-2 top-[9px] h-[7px] w-1 rounded-[8px] bg-current" />
        <b className="absolute right-[6px] top-[11px] h-[5px] w-2 rotate-[-12deg] border-t-[3px] border-current" />
        <em className="absolute bottom-[6px] left-2 h-[9px] w-[17px] rounded-[0_0_18px_18px] border-b-[3px] border-current" />
      </span>
      <span>
        knew it<span className="ml-px">.</span>
      </span>
    </Link>
  );
}

function Chart({ className, yellow }: { className?: string; yellow?: boolean }) {
  return (
    <svg
      className={cn('block h-auto w-full overflow-visible', className)}
      viewBox="0 0 360 130"
      fill="none"
      aria-hidden="true"
    >
      <path className="stroke-1 stroke-[oklch(.6_0_0/.12)] [stroke-dasharray:3_4]" d="M0 25H360M0 65H360M0 105H360" />
      <path
        className={yellow ? 'fill-[oklch(.92_.19_99/.07)]' : 'fill-[oklch(.74_.14_157/.08)]'}
        d="M0 110L17 101L29 108L48 81L62 85L79 72L95 89L109 78L124 82L139 57L155 65L170 43L186 54L202 48L219 64L236 39L248 45L267 23L280 34L297 14L312 26L329 18L343 29L360 9V130H0Z"
      />
      <path
        className={cn(
          'stroke-3 [stroke-linecap:round] [stroke-linejoin:round]',
          yellow ? 'stroke-[oklch(.92_.19_99)]' : 'stroke-[oklch(.54_.14_157)]'
        )}
        d="M0 110L17 101L29 108L48 81L62 85L79 72L95 89L109 78L124 82L139 57L155 65L170 43L186 54L202 48L219 64L236 39L248 45L267 23L280 34L297 14L312 26L329 18L343 29L360 9"
      />
    </svg>
  );
}

const SIDE_ASSETS: Array<[string, string, string, string, string]> = [
  ['₿', 'Bitcoin', 'BTC', '$12,840', 'bg-[oklch(.76_.14_73)]'],
  ['◎', 'Solana', 'SOL', '$6,420', 'bg-[oklch(.76_.12_152)]'],
  ['N', 'NVIDIA', 'Stock token', '$5,420', 'bg-[oklch(.76_.14_73)]'],
];

function Phone({ side = false }: { side?: boolean }) {
  return (
    <div
      className={cn(
        'absolute w-[275px] overflow-hidden rounded-[40px] border-[6px] border-[oklch(.22_.006_83)] shadow-[5px_6px_0_oklch(.39_.02_83),14px_35px_45px_oklch(.38_.08_93/.22)]',
        side
          ? 'left-[4px] top-[105px] z-[1] rotate-[-10deg] bg-[oklch(.19_.008_83)] text-[oklch(.97_.01_90)] max-[581px]:left-[20px]'
          : 'left-[225px] top-[42px] z-[2] rotate-[10deg] bg-[oklch(.98_.003_90)] text-landing-ink max-[581px]:left-[242px]'
      )}
      aria-label={side ? 'Crypto interface illustration' : 'Prediction market interface illustration'}
    >
      <div className="flex h-[38px] items-center justify-between px-[18px] text-[9px] font-semibold">
        <span>9:41</span>
        <span className="h-5 w-[76px] rounded-[20px] bg-[oklch(.1_0_0)]" />
        <span>▮▮▮ ▰</span>
      </div>
      <div className="px-4 pb-[15px] pt-3">
        <div className="flex items-center justify-between">
          <strong className="flex items-center gap-[5px] text-[20px] tracking-[-.8px]">
            {side ? 'Your portfolio' : 'Discover'}
            <span className="h-[7px] w-[7px] rounded-full bg-[oklch(.8_.18_95)]" />
          </strong>
          <Search size={18} />
        </div>
        <p className="mt-1 text-[7px] opacity-65">
          {side ? 'A little bit of everything.' : 'Big ideas start with a little curiosity.'}
        </p>
        {side ? (
          <>
            <p className="mt-[27px] text-[29px] font-semibold tracking-[-1px]">
              $24,680<span className="opacity-45">.42</span>
            </p>
            <span className="text-[9px] text-[oklch(.76_.14_155)]">↗ +$1,240.80 (5.29%)</span>
            <Chart yellow className="mb-[10px] mt-[25px]" />
            <div className="mb-[14px] mt-[17px] flex justify-start gap-3 text-[9px] [&>span]:opacity-50">
              <b className="border-b-2 border-current pb-[7px]">Assets</b>
              <span>Activity</span>
            </div>
            {SIDE_ASSETS.map(([symbol, name, ticker, price, coinBg]) => (
              <div
                key={name}
                className="flex items-center gap-[9px] border-t border-[oklch(.6_0_0/.15)] py-[11px] text-[9px]"
              >
                <span className={cn('grid h-[27px] w-[27px] place-items-center rounded-full text-[16px] text-landing-ink', coinBg)}>
                  {symbol}
                </span>
                <div>
                  <b>{name}</b>
                  <small className="mt-[2px] block text-[7px] opacity-50">{ticker}</small>
                </div>
                <strong className="ml-auto text-[9px]">{price}</strong>
              </div>
            ))}
          </>
        ) : (
          <>
        <div className="mb-[14px] mt-5 flex justify-between gap-3 text-[9px] [&>span]:opacity-50">
          <b className="border-b-2 border-current pb-[7px]">For you</b>
          <span>Trending</span>
          <span>Sports</span>
          <span>Crypto</span>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[oklch(.9_.005_90)] bg-white">
          <div className="relative flex h-[107px] items-center justify-center overflow-hidden bg-[oklch(.87_.1_87)]">
            <span className="mt-[27px] h-[110px] w-[110px] rotate-[-15deg] rounded-full border-[3px] border-[oklch(.61_.15_69)] text-center text-[105px] font-bold leading-none text-[oklch(.61_.15_69)] [text-shadow:3px_4px_0_oklch(.95_.08_94)]">
              ₿
            </span>
            <span className="absolute left-3 top-[10px] text-[6px] font-bold tracking-[1.7px]">THE NEXT BIG MOVE</span>
          </div>
          <div className="p-[13px]">
            <span className="text-[6px] tracking-[1px] opacity-65">CRYPTO · EXAMPLE MARKET</span>
            <h3 className="mt-[6px] text-[20px] font-bold leading-[1.15] tracking-[-.6px]">
              Bitcoin to $150k
              <br />
              this year?
            </h3>
            <div className="mt-[14px] flex items-center gap-2">
              <strong className="text-[32px] tracking-[-1.5px]">
                67<span className="text-[19px]">%</span>
              </strong>
              <span className="text-[7px] text-landing-muted">
                chance
                <br />
                <b className="text-[6px] text-[oklch(.47_.12_158)]">↗ 8% today</b>
              </span>
              <Chart className="ml-auto w-[68px]" />
            </div>
            <div className="mt-[11px] flex gap-[7px] text-center text-[9px] font-semibold">
              <span className="flex-1 rounded-[6px] bg-[oklch(.91_.075_155)] p-2 text-[oklch(.35_.1_155)]">Yes 67¢</span>
              <span className="flex-1 rounded-[6px] bg-[oklch(.94_.03_24)] p-2 text-[oklch(.48_.13_24)]">No 33¢</span>
            </div>
          </div>
        </div>
        <div className="mb-[10px] mt-[15px] flex justify-between text-[8px]">
          <b>On your radar</b>
          <span className="text-[7px] opacity-50">View all ↗</span>
        </div>
        <div className="flex items-center gap-[7px] text-[8px]">
          <span className="rounded-[7px] bg-[oklch(.94_.025_90)] p-1 text-[18px]">🏆</span>
          <b>Who takes the title?</b>
          <strong className="ml-auto">48%</strong>
        </div>
          </>
        )}
        <div className="mt-[18px] flex items-center justify-between border-t border-[oklch(.6_0_0/.18)] px-1 pt-[13px] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:opacity-60">
          <Globe2 />
          <BarChart3 />
          <TrendingUp />
          <span className="grid h-[21px] w-[21px] place-items-center rounded-full bg-landing-yellow text-[9px] text-landing-ink">
            K
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMarket, setActiveMarket] = useState(0);
  const market = marketViews[activeMarket] ?? marketViews[0]!;
  const MarketIcon = market.icon;

  return (
    <div
      className={cn(
        'overflow-clip bg-landing-paper leading-normal text-landing-ink [-webkit-tap-highlight-color:transparent] [&_svg]:shrink-0',
        jakarta.className
      )}
    >
      <a
        className={cn('absolute -top-[100px] left-5 z-[100] rounded-lg bg-landing-paper px-5 py-3 focus:top-3', FOCUS)}
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="bg-landing-yellow">
        <header className="relative z-[5] mx-auto flex max-w-[1320px] items-center justify-between gap-6 px-12 py-7 max-[1101px]:px-8 max-[1101px]:py-6 max-[801px]:px-6 max-[801px]:py-[22px] max-[581px]:p-5 max-[361px]:px-[15px] max-[361px]:py-[18px]">
          <Logo />
          <nav
            className="flex gap-8 text-[13px] font-semibold max-[801px]:gap-5 max-[581px]:hidden"
            aria-label="Main navigation"
          >
            <a className={cn('hover:opacity-60', FOCUS)} href="#markets">
              Markets
            </a>
            <a className={cn('hover:opacity-60', FOCUS)} href="#experience">
              The experience
            </a>
            <a className={cn('hover:opacity-60', FOCUS)} href="#faq">
              FAQs
            </a>
          </nav>
          <div className="flex items-center gap-[25px] max-[801px]:gap-[15px] max-[581px]:gap-[6px]">
            <Link href="/sign-in" className={cn('text-[13px] font-semibold max-[581px]:hidden', FOCUS)}>
              Log in
            </Link>
            <Link
              href="/sign-in"
              className={cn(
                BUTTON_DARK,
                'gap-[17px] px-[21px] py-[13px] text-[12px] max-[801px]:hidden max-[581px]:flex max-[581px]:gap-[10px] max-[581px]:px-[15px] max-[581px]:py-[10px] max-[581px]:text-[10px] max-[361px]:px-3'
              )}
            >
              Explore app <ArrowUpRight size={17} />
            </Link>
            <button
              type="button"
              className={cn('hidden cursor-pointer border-0 bg-transparent p-2 max-[581px]:block', FOCUS)}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              aria-controls="ki-mobile-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>
        {menuOpen && (
          <nav
            id="ki-mobile-nav"
            className="hidden max-[581px]:flex max-[581px]:flex-col max-[581px]:gap-0 max-[581px]:border-b max-[581px]:border-[oklch(.19_.014_83/.15)] max-[581px]:bg-landing-yellow max-[581px]:px-6 max-[581px]:pb-5 max-[581px]:pt-[5px]"
            aria-label="Mobile navigation"
          >
            <a className={cn('py-3 text-[14px] font-medium', FOCUS)} href="#markets" onClick={() => setMenuOpen(false)}>
              Markets
            </a>
            <a className={cn('py-3 text-[14px] font-medium', FOCUS)} href="#experience" onClick={() => setMenuOpen(false)}>
              The experience
            </a>
            <a className={cn('py-3 text-[14px] font-medium', FOCUS)} href="#faq" onClick={() => setMenuOpen(false)}>
              FAQs
            </a>
            <Link className={cn('py-3 text-[14px] font-medium', FOCUS)} href="/sign-in">
              Log in
            </Link>
          </nav>
        )}
        <main id="main-content">
          <section
            className="mx-auto grid min-h-[730px] max-w-[1320px] grid-cols-2 items-center gap-[15px] px-12 pb-[85px] pt-10 min-[1450px]:min-h-[790px] max-[1101px]:min-h-[660px] max-[1101px]:px-8 max-[1101px]:pb-[65px] max-[1101px]:pt-[35px] max-[801px]:grid-cols-1 max-[801px]:gap-[25px] max-[801px]:px-6 max-[801px]:pb-[50px] max-[801px]:pt-[30px] max-[801px]:text-center max-[581px]:gap-3 max-[581px]:px-5 max-[581px]:pb-[35px] max-[581px]:pt-[15px]"
            aria-labelledby="ki-hero-title"
          >
            <div className="motion-safe:animate-ki-rise max-[801px]:pt-5 max-[581px]:pt-[15px]">
              <span className={EYEBROW}>
                <span className="h-[7px] w-[7px] rounded-full bg-landing-ink shadow-[0_0_0_4px_oklch(.19_.014_83/.08)]" /> ONE
                APP. A WORLD OF POSSIBILITIES.
              </span>
              <h1
                id="ki-hero-title"
                className="mb-[26px] mt-[27px] text-[length:clamp(64px,7.3vw,102px)] font-bold leading-[.99] tracking-[-7px] max-[1101px]:text-[80px] max-[1101px]:tracking-[-5px] max-[801px]:mx-auto max-[801px]:mt-[23px] max-[801px]:max-w-[600px] max-[801px]:text-[85px] max-[801px]:leading-[.98] max-[581px]:mb-[23px] max-[581px]:text-[65px] max-[581px]:leading-[1.02] max-[581px]:tracking-[-4px] max-[361px]:text-[57px]"
              >
                A hunch.
                <br />
                A move.
                <br />
                <span className="text-[oklch(.47_.07_95)]">A knew it.</span>
              </h1>
              <p className="max-w-[385px] text-[16px] leading-[1.75] text-[oklch(.36_.035_83)] max-[1101px]:max-w-[330px] max-[1101px]:text-[14px] max-[801px]:mx-auto max-[801px]:max-w-[395px] max-[801px]:text-[15px] max-[581px]:max-w-[310px] max-[581px]:text-[13px] max-[581px]:leading-[1.8]">
                From tomorrow&rsquo;s headlines to your next favorite coin. Predictions, crypto, perps, and stocks. All
                together.
              </p>
              <div className="mt-[30px] flex items-center gap-[27px] max-[1101px]:gap-[19px] max-[801px]:justify-center max-[581px]:mt-6 max-[581px]:gap-5">
                <Link
                  href="/sign-in"
                  className={cn(
                    BUTTON_DARK,
                    'gap-[25px] px-[27px] py-[18px] text-[14px] max-[1101px]:px-[22px] max-[1101px]:py-4 max-[1101px]:text-[12px] max-[581px]:gap-[15px] max-[581px]:px-[21px] max-[581px]:py-[15px] max-[581px]:text-[11px]'
                  )}
                >
                  Explore Knew It <ArrowUpRight size={20} />
                </Link>
                <a className={TEXT_LINK} href="#markets">
                  Take a look <ArrowRight size={18} className={TEXT_LINK_ICON} />
                </a>
              </div>
            </div>
            <div className="relative isolate h-[600px] motion-safe:animate-ki-rise-slow min-[1450px]:scale-[1.05] max-[1101px]:mr-[-100px] max-[1101px]:w-[550px] max-[1101px]:origin-left max-[1101px]:scale-[.83] max-[801px]:mx-auto max-[801px]:mb-[-50px] max-[801px]:h-[580px] max-[801px]:origin-top max-[801px]:scale-[.9] max-[801px]:text-left max-[581px]:left-1/2 max-[581px]:ml-[-275px] max-[581px]:mt-0 max-[581px]:mb-[-220px] max-[581px]:h-[600px] max-[581px]:scale-[.61] max-[361px]:mb-[-260px] max-[361px]:scale-[.54]">
              <div className="pointer-events-none absolute left-[-20px] top-0 -z-10 h-[610px] w-[610px] rounded-full border border-[oklch(.59_.09_95/.22)]" />
              <div className="pointer-events-none absolute left-[55px] top-[75px] -z-10 h-[460px] w-[460px] rounded-full border border-[oklch(.59_.09_95/.22)]" />
              <span className="absolute right-[-10px] top-0 rotate-[13deg] text-[83px] leading-none max-[581px]:right-0 max-[581px]:top-4" aria-hidden="true">✳</span>
              <Phone side />
              <Phone />
              <div className="absolute bottom-[34px] left-[calc(50%_-_205px)] z-[3] flex rotate-[-5deg] items-center gap-3 rounded-[17px] bg-white px-[21px] py-4 shadow-[0_12px_35px_oklch(.38_.08_93/.15)] motion-safe:animate-ki-float">
                <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] bg-landing-yellow">
                  <Sparkles size={20} />
                </span>
                <div>
                  <b className="block text-[13px]">Trust your take.</b>
                  <span className="mt-[2px] block text-[9px] text-landing-muted">There&rsquo;s a market for that.</span>
                </div>
              </div>
              <span className="absolute bottom-[-30px] right-[15px] text-[8px] opacity-60 max-[581px]:bottom-[-22px] max-[581px]:right-[45px] max-[581px]:text-[11px]">Product preview · illustrative data</span>
            </div>
          </section>
        </main>
        <div
          className="mx-auto flex max-w-[1320px] items-center justify-between gap-[25px] border-t border-[oklch(.19_.014_83/.15)] px-12 py-[25px] max-[1101px]:gap-[15px] max-[1101px]:px-8 max-[1101px]:py-[22px] max-[801px]:justify-start max-[801px]:gap-[35px] max-[801px]:overflow-x-auto max-[801px]:[scrollbar-width:none] max-[581px]:gap-[26px] max-[581px]:px-5 max-[581px]:py-[19px] [&>span]:flex [&>span]:items-center [&>span]:gap-8 [&>span]:whitespace-nowrap [&>span]:text-[10px] [&>span]:font-semibold [&>span]:tracking-[1.3px] max-[1101px]:[&>span]:gap-[15px] max-[1101px]:[&>span]:text-[8px] max-[801px]:[&>span]:gap-[18px] max-[801px]:[&>span]:text-[9px] max-[581px]:[&>span]:gap-[14px] max-[581px]:[&>span]:text-[8px] [&_svg]:h-[17px] [&_svg]:w-[17px] max-[581px]:[&_svg]:w-[14px]"
          aria-label="Markets to explore"
        >
          <span>
            PREDICTIONS <Globe2 />
          </span>
          <span>
            CRYPTO <Bitcoin />
          </span>
          <span>
            MEMECOINS <Sparkles />
          </span>
          <span>
            PERPS <Zap />
          </span>
          <span>
            TOKENIZED STOCKS <BarChart3 />
          </span>
        </div>
      </div>

      <section className={cn(SECTION, 'scroll-mt-7')} id="markets" aria-labelledby="ki-markets-title">
        <div className="text-center">
          <span className={EYEBROW}>FOLLOW YOUR CURIOSITY</span>
          <h2 id="ki-markets-title" className={SECTION_H2}>
            Your world.
            <br />
            <span className="text-[oklch(.56_.014_83)]">Your markets.</span>
          </h2>
          <p className="text-[14px] leading-[1.8] text-landing-muted max-[581px]:text-[12px]">
            The things you follow. The ideas you believe in.
            <br />A home for every kind of market mind.
          </p>
        </div>
        <div
          className="mx-auto mb-[30px] mt-[38px] flex w-fit justify-center gap-2 rounded-full border border-[oklch(.91_.008_90)] bg-[oklch(.945_.008_90)] p-[6px] max-[581px]:mt-7 max-[581px]:w-full max-[581px]:justify-between max-[581px]:gap-[2px] max-[581px]:p-[5px]"
          role="tablist"
          aria-label="Explore market types"
        >
          {marketViews.map((view, index) => (
            <button
              key={view.name}
              type="button"
              role="tab"
              id={`ki-tab-${index}`}
              aria-selected={activeMarket === index}
              aria-controls="ki-market-panel"
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
                document.getElementById(`ki-tab-${next}`)?.focus();
              }}
            >
              <view.icon size={18} />
              {view.name}
            </button>
          ))}
        </div>
        <div
          className={cn(
            'grid min-h-[435px] grid-cols-2 overflow-hidden rounded-[28px] bg-[oklch(.95_.027_95)] max-[581px]:grid-cols-1 max-[581px]:rounded-[22px]',
            FOCUS
          )}
          role="tabpanel"
          id="ki-market-panel"
          aria-labelledby={`ki-tab-${activeMarket}`}
          tabIndex={0}
        >
          <div className="self-center px-11 py-16 max-[1101px]:px-[30px] max-[1101px]:py-10 max-[801px]:px-[23px] max-[801px]:py-[30px] max-[581px]:px-[27px] max-[581px]:py-8">
            <span className={cn(EYEBROW, 'text-[8px] tracking-[1px]')}>{market.eyebrow}</span>
            <h3 className="my-[19px] text-[39px] font-semibold leading-[1.15] tracking-[-1.8px] max-[1101px]:text-[33px] max-[801px]:text-[29px] max-[801px]:tracking-[-1px] max-[581px]:text-[33px]">
              {market.title}
              <br />
              <span className="text-[oklch(.51_.04_90)]">{market.accent}</span>
            </h3>
            <p className="max-w-[330px] text-[13px] leading-[1.8] text-landing-muted max-[581px]:text-[12px]">
              {market.description}
            </p>
            <Link href="/sign-in" className={cn(TEXT_LINK, 'mt-[26px]')}>
              Explore markets <ArrowUpRight size={19} className={TEXT_LINK_ICON} />
            </Link>
          </div>
          <div className="relative isolate grid place-items-center bg-[oklch(.925_.045_95)] px-[45px] py-10 max-[1101px]:px-[28px] max-[1101px]:py-[35px] max-[801px]:px-5 max-[801px]:py-[30px] max-[581px]:px-10 max-[581px]:pb-[37px] max-[581px]:pt-[30px] max-[361px]:p-[25px]">
            <div className="w-full max-w-[360px] rotate-[3deg] rounded-[19px] border border-[oklch(.9_.01_90)] bg-[oklch(.998_0_0)] p-6 shadow-[0_20px_30px_oklch(.4_.03_90/.07)] max-[801px]:p-[18px] max-[581px]:p-[22px]">
              <div className="mb-[19px] flex items-center justify-between">
                <span className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-landing-yellow">
                  <MarketIcon size={26} />
                </span>
              </div>
              <h4 className="max-w-[260px] text-[19px] font-semibold tracking-[-.5px] max-[801px]:text-[17px] max-[581px]:text-[19px]">
                {market.question}
              </h4>
              <div className="my-3 flex items-baseline gap-2">
                <strong className="text-[35px] tracking-[-1px] max-[801px]:text-[27px] max-[581px]:text-[33px]">
                  {market.value}
                </strong>
                <span className="text-[9px] text-landing-muted">{market.unit}</span>
              </div>
              <Chart />
              <div className="mt-2 flex justify-between text-[7px] text-landing-muted">
                <span>9:00 AM</span>
                <span>12:00 PM</span>
                <span>3:00 PM</span>
              </div>
              <div className="mt-[17px] flex items-center justify-between border-t border-[oklch(.91_.008_90)] pt-[17px] text-[10px]">
                <span>{activeMarket === 0 ? "What's your take?" : 'Your next move starts here.'}</span>
                <ArrowUpRight size={20} />
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
      </section>

      <section className="scroll-mt-7 bg-[oklch(.956_.008_90)]" id="experience" aria-labelledby="ki-experience-title">
        <div className={SECTION}>
          <div className="mb-9 flex items-end justify-between gap-[30px] max-[801px]:block">
            <div>
              <span className={EYEBROW}>LESS SWITCHING. MORE EXPLORING.</span>
              <h2
                id="ki-experience-title"
                className={cn(
                  SECTION_H2,
                  'mb-0 text-[44px] tracking-[-2px] max-[1101px]:text-[38px] max-[801px]:text-[38px] max-[581px]:text-[33px]'
                )}
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
                Find your
                <br />
                &ldquo;wait, what if?&rdquo;
              </h3>
              <p className="max-w-[240px] text-[12px] leading-[1.8] text-[oklch(.39_.025_83)] max-[801px]:text-[11px] max-[581px]:max-w-[280px] max-[581px]:text-[12px]">
                Go from a passing thought to a market worth exploring.
              </p>
              <div className="-mx-3 mt-[33px] flex rotate-[-8deg] flex-wrap gap-[9px] max-[801px]:mt-[25px] max-[801px]:gap-[6px] max-[581px]:mx-auto max-[581px]:mb-[30px] max-[581px]:mt-7 max-[581px]:max-w-[330px] [&>span]:rounded-[40px] [&>span]:bg-[oklch(.995_.003_90)] [&>span]:px-[13px] [&>span]:py-[10px] [&>span]:text-[12px] [&>span]:font-medium [&>span]:shadow-[0_3px_4px_oklch(.5_.05_90/.04)] max-[801px]:[&>span]:px-[10px] max-[801px]:[&>span]:py-2 max-[801px]:[&>span]:text-[10px] max-[581px]:[&>span]:px-[13px] max-[581px]:[&>span]:py-[10px] max-[581px]:[&>span]:text-[12px]">
                <span>₿ Bitcoin</span>
                <span>🏀 Sports</span>
                <span>↗ Stocks</span>
                <span>◎ Solana</span>
                <span>🌎 World events</span>
                <span>✳ Memecoins</span>
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
                <span className="text-[7px] text-landing-muted">Live probability</span>
              </div>
            </article>
            <article className="min-h-[397px] overflow-hidden rounded-[23px] bg-[oklch(.9_.054_46)] px-[27px] pt-[30px] max-[1101px]:px-[22px] max-[1101px]:pt-[27px] max-[801px]:min-h-[380px] max-[801px]:px-[18px] max-[801px]:pt-6 max-[581px]:min-h-[345px] max-[581px]:px-[27px] max-[581px]:pt-7">
              <div className="text-[8px] font-semibold tracking-[1px] opacity-65">03 / KEEP IT TOGETHER</div>
              <h3 className="mb-[14px] mt-[25px] text-[28px] font-semibold leading-[1.13] tracking-[-1.2px] max-[1101px]:text-[25px] max-[801px]:text-[22px] max-[581px]:text-[30px]">
                Different markets.
                <br />
                One home.
              </h3>
              <p className="max-w-[240px] text-[12px] leading-[1.8] text-[oklch(.39_.025_83)] max-[801px]:text-[11px] max-[581px]:max-w-[280px] max-[581px]:text-[12px]">
                Explore your watchlist and portfolio without losing your place.
              </p>
              <div className="mt-[30px] rotate-[-5deg] max-[581px]:mx-auto max-[581px]:mb-[-10px] max-[581px]:mt-[25px] max-[581px]:max-w-[300px] [&>span]:mt-[7px] [&>span]:flex [&>span]:items-center [&>span]:gap-[10px] [&>span]:rounded-[10px] [&>span]:bg-[oklch(.995_.003_90)] [&>span]:p-[14px] [&>span]:text-[11px] [&>span]:font-medium [&>span]:shadow-[0_4px_10px_oklch(.4_.03_90/.05)] max-[801px]:[&>span]:gap-[6px] max-[801px]:[&>span]:px-[9px] max-[801px]:[&>span]:py-3 max-[801px]:[&>span]:text-[9px] max-[581px]:[&>span]:p-[15px] max-[581px]:[&>span]:text-[12px] [&>span_svg:last-child]:ml-auto">
                <span>
                  <Globe2 size={19} /> Predictions <ArrowUpRight size={16} />
                </span>
                <span>
                  <Bitcoin size={19} /> Crypto <ArrowUpRight size={16} />
                </span>
                <span>
                  <BarChart3 size={19} /> Tokenized stocks <ArrowUpRight size={16} />
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        className={cn(
          SECTION,
          'scroll-mt-7 grid grid-cols-[1fr_1.2fr] gap-[65px] max-[801px]:grid-cols-[1fr_1.3fr] max-[801px]:gap-[25px] max-[581px]:grid-cols-1 max-[581px]:gap-[30px]'
        )}
        id="faq"
        aria-labelledby="ki-faq-title"
      >
        <div>
          <span className={EYEBROW}>GOOD QUESTIONS.</span>
          <h2
            id="ki-faq-title"
            className={cn(SECTION_H2, 'text-[43px] tracking-[-2px] max-[801px]:text-[33px] max-[581px]:text-[35px]')}
          >
            Glad you asked.
          </h2>
          <p className="text-[14px] leading-[1.8] text-landing-muted">A little context before your next move.</p>
        </div>
        <div>
          {faqs.map((item) => (
            <details key={item.q} className="group border-b border-[oklch(.88_.008_90)] py-[22px] first:pt-0">
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-medium max-[581px]:text-[13px] [&::-webkit-details-marker]:hidden',
                  FOCUS
                )}
              >
                {item.q}
                <ChevronDown size={20} className="transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="pr-8 pt-[15px] text-[12px] leading-[1.85] text-landing-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative mx-auto mb-[70px] max-w-[1144px] overflow-hidden rounded-[30px] bg-landing-yellow px-[30px] py-[65px] text-center max-[1101px]:mx-8 max-[801px]:mx-6 max-[801px]:mb-[50px] max-[581px]:mx-5 max-[581px]:mb-10 max-[581px]:rounded-[22px] max-[581px]:px-5 max-[581px]:py-12">
        <span className={EYEBROW}>YOU HAD A FEELING.</span>
        <h2 className="mb-[30px] mt-5 text-[75px] font-semibold leading-none tracking-[-4px] max-[581px]:text-[57px] max-[581px]:tracking-[-3px]">
          Make it a
          <br />
          <span className="text-[oklch(.47_.07_95)]">&ldquo;knew it.&rdquo;</span>
        </h2>
        <Link
          href="/sign-in"
          className={cn(
            BUTTON_DARK,
            'gap-[25px] px-[27px] py-[18px] text-[14px] max-[581px]:px-[23px] max-[581px]:py-4 max-[581px]:text-[12px]'
          )}
        >
          Explore the app <ArrowUpRight size={20} />
        </Link>
        <span
          className="absolute right-[9%] top-[70px] rotate-[15deg] text-[130px] leading-none max-[1101px]:right-[6%] max-[1101px]:text-[95px] max-[801px]:right-[5%] max-[801px]:top-[25px] max-[801px]:text-[70px] max-[581px]:right-[14px] max-[581px]:top-6 max-[581px]:text-[45px]"
          aria-hidden="true"
        >
          ✳
        </span>
      </section>
      <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-[25px] px-12 pb-[30px] max-[801px]:px-6 max-[801px]:pb-[25px] max-[581px]:px-5">
        <div>
          <Logo footer />
          <p className="mt-3 text-[11px] text-landing-muted max-[581px]:text-[10px]">A home for your next move.</p>
        </div>
        <nav
          className="flex gap-[25px] text-[11px] max-[581px]:w-full max-[581px]:flex-wrap max-[581px]:gap-[23px] max-[581px]:text-[10px] [&>a]:inline-flex [&>a]:items-center [&>a]:gap-1"
          aria-label="Footer navigation"
        >
          <a className={cn('hover:opacity-60', FOCUS)} href="#markets">
            Markets
          </a>
          <a className={cn('hover:opacity-60', FOCUS)} href="#experience">
            The experience
          </a>
          <a className={cn('hover:opacity-60', FOCUS)} href="#faq">
            FAQs
          </a>
          <Link className={cn('hover:opacity-60', FOCUS)} href="/sign-in">
            Log in <ArrowUpRight size={14} />
          </Link>
        </nav>
        <div className="mt-[15px] flex w-full justify-between border-t border-[oklch(.9_.008_90)] pt-[22px] text-[9px] text-landing-muted max-[581px]:mt-0 max-[581px]:flex-col max-[581px]:gap-2 max-[581px]:text-[8px]">
          <span>© {new Date().getFullYear()} Knew It</span>
          <span>Trading involves risk.</span>
        </div>
      </footer>
    </div>
  );
}
