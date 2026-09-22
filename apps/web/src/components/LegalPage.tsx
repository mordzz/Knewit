'use client';

import { Children, isValidElement, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { FOCUS, PRIMARY_BUTTON } from '@/features/landing/components/LandingHeader';

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type SectionEntry = { id: string; title: string };

export function LegalPage({
  title,
  effectiveDate = '[EFFECTIVE DATE]',
  children,
}: {
  title: string;
  effectiveDate?: string | null;
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sections: SectionEntry[] = useMemo(() => {
    const entries: SectionEntry[] = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child) && typeof (child.props as { title?: string }).title === 'string') {
        const t = (child.props as { title: string }).title;
        entries.push({ id: slugify(t), title: t });
      }
    });
    return entries;
  }, [children]);

  return (
    <main className="min-h-screen bg-landing-paper font-sans text-landing-ink">
      <LandingHeader anchorPrefix="/" />

      <section className="border-b border-landing-ink/10 bg-white px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto max-w-[1180px]">
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
            {title}
          </h1>
          {effectiveDate ? (
            <p className="mt-4 text-sm font-medium text-landing-ink/45">Effective date: {effectiveDate}</p>
          ) : null}
        </div>
      </section>

      <article className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-landing-ink/40 lg:block">On this page</p>
            <nav className="mt-4 hidden max-h-[70vh] flex-col gap-0.5 overflow-y-auto border-l border-landing-ink/10 pr-2 lg:flex" aria-label="Table of contents">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    '-ml-px border-l-2 border-transparent px-4 py-1.5 text-sm leading-snug text-landing-ink/50 transition-colors hover:border-landing-ink/20 hover:text-landing-ink',
                    activeId === s.id && 'border-landing-ink font-semibold text-landing-ink',
                    FOCUS
                  )}
                >
                  {s.title}
                </a>
              ))}
            </nav>

          </aside>

          <div className="min-w-0 max-w-[720px] space-y-11 text-[15px] leading-7 text-landing-muted">
            {children}

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-landing-ink/10 pt-6 text-sm font-semibold text-landing-muted">
              <Link href="/docs" className={cn('hover:text-landing-ink', FOCUS)}>Docs</Link>
              <Link href="/privacy" className={cn('hover:text-landing-ink', FOCUS)}>Privacy Policy</Link>
              <Link href="/terms" className={cn('hover:text-landing-ink', FOCUS)}>Terms of Service</Link>
            </nav>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start gap-5 rounded-[28px] bg-landing-ink px-8 py-10 text-landing-paper sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Ready when you are</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Explore Knew it on the web</h2>
            <p className="mt-2 max-w-md text-sm text-white/60">Browse markets, manage positions, and join the community in the web app.</p>
          </div>
          <Link href="/sign-in" className={cn(PRIMARY_BUTTON, 'shrink-0 bg-landing-yellow text-landing-ink hover:bg-landing-yellow/90')}>
            Explore Knew it <ArrowUpRight size={16} />
          </Link>
        </div>
      </article>

      <LandingFooter />
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  const id = slugify(title);
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-semibold tracking-[-0.01em] text-landing-ink">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
