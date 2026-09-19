import Image from 'next/image';
import { TrendingUp } from 'lucide-react';
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
    <section className="relative hidden overflow-hidden border-r border-border bg-surface p-12 lg:flex lg:flex-col">
      <div className="flex items-center gap-2.5">
        <Image src="/icon.png" alt="" width={36} height={36} className="rounded-lg" />
        <span className="text-lg font-inter-bold text-text-primary">Knewit</span>
      </div>
      <div className="my-auto max-w-2xl">
        <h1 className="mt-6 max-w-xl font-inter-bold text-5xl leading-[1.06] text-text-primary">
          Your next move starts here.
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-7 text-text-secondary">
          Predictions, crypto, memecoins, perps, and tokenized stocks. One app.
        </p>
        <div className="relative mt-12 h-80">
          <div className={`absolute left-0 top-0 w-[54%] ${CARD_SURFACE_CLASS} p-5 shadow-2xl`}>
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
          <div className={`absolute bottom-0 right-0 w-[42%] ${CARD_SURFACE_CLASS} p-5 shadow-2xl`}>
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
      <p className="text-xs text-text-tertiary">Markets involve risk. Trade responsibly.</p>
    </section>
  );
}
