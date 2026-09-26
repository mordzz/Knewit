import Link from 'next/link';
import { cn } from '@/lib/cn';
import { FOCUS, Logo } from '@/features/landing/components/LandingHeader';

export function LandingFooter() {
  return (
    <footer className="bg-landing-ink px-6 py-10 text-landing-paper lg:px-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-8">
        <div><Logo /><p className="mt-3 text-xs text-white/45">Markets, positions, and calls in one place.</p></div>
        <nav className="flex flex-wrap gap-6 text-sm text-white/65" aria-label="Footer navigation">
          <Link className={cn('hover:text-white', FOCUS)} href="/#markets">Markets</Link>
          <Link className={cn('hover:text-white', FOCUS)} href="/#how-it-works">How it works</Link>
          <Link className={cn('hover:text-white', FOCUS)} href="/#faq">FAQ</Link>
          <Link className={cn('hover:text-white', FOCUS)} href="/docs">Docs</Link>
          <Link className={cn('hover:text-white', FOCUS)} href="/download">Download</Link>
          <Link className={cn('hover:text-white', FOCUS)} href="/privacy">Privacy</Link>
          <Link className={cn('hover:text-white', FOCUS)} href="/terms">Terms</Link>
        </nav>
        <div className="w-full border-t border-white/10 pt-6 text-[11px] text-white/35"><span>© {new Date().getFullYear()} Knew it</span></div>
      </div>
    </footer>
  );
}
