'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const FOCUS =
  'focus-visible:outline-3 focus-visible:outline-[oklch(.5_.19_275)] focus-visible:outline-offset-4';

export const PRIMARY_BUTTON = cn(
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-landing-ink px-6 py-3 text-sm font-semibold text-landing-paper',
  'transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[oklch(.25_.014_83)]',
  FOCUS
);

export function Logo() {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2.5 font-bold tracking-[-0.04em]', FOCUS)} aria-label="Knew it home">
      <Image src="/logo-mark.png" alt="" width={36} height={36} />
      <span className="text-[22px]">Knew it</span>
    </Link>
  );
}

export function LandingHeader({ anchorPrefix = '' }: { anchorPrefix?: '' | '/' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const href = (hash: string) => `${anchorPrefix}${hash}`;

  return (
    <div className="sticky top-0 z-50 bg-landing-yellow/90 backdrop-blur-md">
      <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Main navigation">
          <a className={cn('hover:opacity-60', FOCUS)} href={href('#markets')}>Markets</a>
          <a className={cn('hover:opacity-60', FOCUS)} href={href('#how-it-works')}>How it works</a>
          <a className={cn('hover:opacity-60', FOCUS)} href={href('#faq')}>FAQ</a>
          <Link className={cn('hover:opacity-60', FOCUS)} href="/docs">Docs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/download" className={cn('hidden px-3 py-2 text-sm font-semibold sm:inline-flex', FOCUS)}>
            Download
          </Link>
          <Link href="/sign-in" className={cn(PRIMARY_BUTTON, 'hidden min-h-10 px-5 py-2.5 text-xs md:inline-flex')}>
            Explore app <ArrowUpRight size={16} />
          </Link>
          <button
            type="button"
            className={cn('grid size-10 place-items-center rounded-full md:hidden', FOCUS)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <nav
          id="landing-mobile-nav"
          className="relative z-10 border-t border-landing-ink/10 px-6 pb-5 pt-2 md:hidden"
          aria-label="Mobile navigation"
        >
          {[
            ['Markets', href('#markets')],
            ['How it works', href('#how-it-works')],
            ['FAQ', href('#faq')],
          ].map(([label, itemHref]) => (
            <a
              key={itemHref}
              href={itemHref}
              className={cn('block border-b border-landing-ink/10 py-3 text-sm font-medium', FOCUS)}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <Link href="/download" className={cn('block border-b border-landing-ink/10 py-3 text-sm font-medium', FOCUS)}>Download</Link>
          <Link href="/docs" className={cn('block border-b border-landing-ink/10 py-3 text-sm font-medium', FOCUS)} onClick={() => setMenuOpen(false)}>Docs</Link>
          <Link href="/sign-in" className={cn('block py-3 text-sm font-medium', FOCUS)}>Explore app</Link>
        </nav>
      ) : null}
    </div>
  );
}
