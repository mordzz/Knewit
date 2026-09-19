import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check, ShieldCheck } from 'lucide-react';
import { FaApple, FaGooglePlay } from 'react-icons/fa6';
import { LandingHeader, PRIMARY_BUTTON } from '@/components/landing/LandingHeader';

export const metadata: Metadata = {
  title: 'Download Knew it',
  description: 'Knew it for iOS and Android is coming soon. Explore the web app today.',
};

const platforms = [
  {
    name: 'iPhone and iPad',
    store: 'App Store',
    icon: FaApple,
  },
  {
    name: 'Android phones',
    store: 'Google Play',
    icon: FaGooglePlay,
  },
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-landing-yellow font-sans text-landing-ink selection:bg-landing-ink selection:text-landing-yellow">
      <LandingHeader anchorPrefix="/" />

      <section className="mx-auto grid min-h-[calc(100svh-80px)] max-w-[1280px] grid-cols-[.9fr_1.1fr] items-center gap-8 px-6 pb-16 pt-8 lg:px-10 max-[900px]:grid-cols-1 max-[900px]:gap-12 max-[900px]:pb-12 max-[900px]:pt-14">
        <div>
          <h1 className="max-w-[820px] text-balance text-[clamp(3.25rem,7vw,6rem)] font-bold leading-[.96] tracking-[-0.04em] max-[520px]:text-[clamp(3rem,14vw,4rem)]">
            Knew it for iOS and Android.
          </h1>
          <p className="mt-7 max-w-[580px] text-pretty text-lg leading-8 text-[oklch(.35_.035_83)] max-[520px]:text-base max-[520px]:leading-7">
            The mobile app is on the way. Until then, explore markets, positions, and community calls in the web app.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/sign-in"
              className={PRIMARY_BUTTON}
            >
              Explore Knew it now <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-landing-paper p-8 shadow-[0_28px_70px_oklch(.38_.08_93/.17)] max-[520px]:p-5">
          <div className="flex items-start justify-between gap-6 border-b border-landing-ink/10 pb-7">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.025em]">Choose your platform</h2>
              <p className="mt-2 text-sm leading-6 text-landing-muted">Public store downloads are not available yet.</p>
            </div>
            <span className="shrink-0 rounded-full bg-landing-yellow px-3 py-1.5 text-xs font-semibold">Coming soon</span>
          </div>

          <div>
            {platforms.map((platform) => (
              <article key={platform.store} className="flex items-center gap-4 border-b border-landing-ink/10 py-6 last:border-b-0">
                <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-landing-ink text-landing-paper">
                  <platform.icon size={22} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{platform.store}</h3>
                  <p className="mt-1 text-xs text-landing-muted">For {platform.name}</p>
                </div>
                <button
                  type="button"
                  disabled
                  aria-describedby="store-status"
                  className="min-h-10 shrink-0 cursor-not-allowed rounded-full border border-landing-ink/10 bg-landing-ink/[.04] px-4 py-2 text-xs font-semibold text-landing-muted disabled:opacity-70"
                >
                  Coming soon
                </button>
              </article>
            ))}
          </div>

          <div id="store-status" className="mt-2 rounded-2xl bg-[oklch(.95_.027_95)] p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0" size={19} />
              <div>
                <p className="text-sm font-semibold">Only official store downloads</p>
                <p className="mt-1 text-xs leading-5 text-landing-muted">Store links will appear here when the public release is ready. Knew it will not ask you to install files from another source.</p>
              </div>
            </div>
          </div>

          <ul className="mt-6 grid gap-3 text-xs text-landing-muted sm:grid-cols-2" aria-label="Mobile app features">
            {['Secure embedded wallet', 'Markets and positions', 'Community callouts', 'One account across devices'].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check size={14} className="text-[oklch(.43_.1_155)]" /> {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
