import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Zap, ShieldCheck, Globe2 } from 'lucide-react';
import { Sparkline } from '@/components/ui/Sparkline';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';

/**
 * Left-column showcase panel shown next to the real sign-in form at
 * `lg:` and up — ported from the left column of
 * `apps/dekstop/src/components/knew/sign-in.tsx`, restyled with this
 * app's own tokens (`--color-*` in `globals.css`) and Inter instead of
 * dekstop's placeholder oklch palette and "Work Sans"/"Instrument
 * Serif". Purely decorative; the actual sign-in form lives in
 * `app/sign-in/page.tsx` and is unchanged by this.
 */
export function SignInShowcase() {
  return (
    <section className="relative hidden overflow-hidden bg-landing-yellow p-12 text-landing-ink lg:flex lg:flex-col">
      <Link
        href="/"
        aria-label="Back to home"
        className="flex w-fit items-center gap-2.5 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-4"
      >
        <Image src="/icon.png" alt="" width={36} height={36} className="rounded-lg" />
        <span className="text-lg font-inter-bold text-text-collor">Knew it</span>
      </Link>
      <div className="my-auto max-w-2xl">
        <h1 className="mt-6 max-w-xl font-inter-bold text-7xl leading-[1.02] tracking-[-0.03em]">
          See the market. Back your take.
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-7 text-landing-ink/70">
          Predictions, crypto, memecoins, perps, and tokenized stocks. One app.
        </p>
        <ul className="mt-8 space-y-3 text-sm font-inter-medium text-landing-ink/80">
          <li className="flex items-center gap-2.5"><Globe2 className="size-4" /> Predictions, crypto, and stocks in one place</li>
          <li className="flex items-center gap-2.5"><Zap className="size-4" /> Live prices and positions</li>
          <li className="flex items-center gap-2.5"><ShieldCheck className="size-4" /> Secure account-backed access</li>
        </ul>
        <div className="relative mt-10 h-80">
          <div className={`absolute left-0 top-0 w-[54%] -rotate-2 ${CARD_SURFACE_CLASS} p-5 shadow-2xl`}>
            <span className="text-xs font-inter-medium text-accent">Featured prediction</span>
            <p className="mt-4 font-inter-semibold text-text-primary">Will Bitcoin reach $150K before 2027?</p>
            <div className="mt-6 grid grid-cols-[auto_1fr] items-end gap-6">
              <div>
                <span className="text-4xl font-inter-semibold tabular-nums text-text-primary">57%</span>
                <p className="text-xs text-text-tertiary">chance</p>
              </div>
              <Sparkline points={[38, 41, 47, 43, 49, 51, 48, 54, 52, 55, 57]} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <span className="rounded-md bg-yes p-2 text-center text-xs font-inter-semibold text-text-inverse">
                Yes · 57¢
              </span>
              <span className="rounded-md bg-no p-2 text-center text-xs font-inter-semibold text-text-inverse">
                No · 43¢
              </span>
            </div>
          </div>
          <div className={`absolute bottom-0 right-0 w-[42%] rotate-2 ${CARD_SURFACE_CLASS} p-5 shadow-2xl`}>
            <p className="text-xs text-text-tertiary">Portfolio value</p>
            <p className="mt-2 text-2xl font-inter-semibold tabular-nums text-text-primary">$24,680.42</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-yes">
              <TrendingUp className="size-3" />
              +5.29% this month
            </p>
            <div className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Predictions</span>
                <span className="text-text-primary">48%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Crypto</span>
                <span className="text-text-primary">27%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-landing-ink/60">Markets involve risk. Trade responsibly.</p>
    </section>
  );
}
