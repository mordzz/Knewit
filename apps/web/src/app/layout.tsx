import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/app/providers';
import './globals.css';

// Same typeface `apps/mobile` loads (`theme/typography.ts`'s doc
// comment: Inter as the freely-licensed substitute for X's proprietary
// Chirp) — one variable font covering every weight `font-inter-*`
// (`globals.css`) needs, instead of static per-weight files like the
// Expo app installs (Google Fonts' web delivery already serves Inter
// as a single variable font).
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Knewit',
  description: 'A social prediction-market app — where hype becomes opportunity.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background font-sans text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
