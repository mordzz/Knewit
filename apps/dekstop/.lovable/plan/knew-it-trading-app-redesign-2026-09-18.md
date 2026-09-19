# Knew It Trading App Redesign

## Goal
Turn the blank project into a polished, responsive Knew It trading experience led by prediction markets, while establishing reusable patterns for crypto, memecoins, perpetuals, and tokenized stocks.

## What I’ll build
- Create a charcoal, off-white, and signature-yellow design system with compact spacing, crisp borders, accessible states, Geist typography, and tabular market figures.
- Build a responsive application shell with desktop sidebar/top bar and a mobile header/bottom navigation.
- Make Discover the home screen, featuring one prominent prediction market, category filters, trending prediction cards, and restrained secondary asset sections.
- Add dedicated Markets, Watchlist, Portfolio, and Activity screens so every navigation item works.
- Add a prediction-market detail screen with chart ranges, Overview/Activity/Rules tabs, outcome selection, and a conditional-payout order panel.
- Add a sign-in screen with a compact mobile-first form and a desktop product-preview composition. Because no authentication integration currently exists, submission will remain a clearly non-successful demo interaction.
- Use clearly labeled demo market and portfolio data throughout; no transactions, deposits, or authentication will be simulated as successful.

## Responsive behavior
- Desktop uses fixed navigation, global search, balance, and a two-column market-detail view.
- Mobile uses safe-area spacing, scrollable category tabs, compact previews, bottom navigation, and sheet-based trade entry.

## Technical details
- Extend the existing TanStack Start routes rather than replacing the framework.
- Reuse the installed button, input, sheet, tabs, and chart foundations where appropriate.
- Create shared navigation, chart, market-card, asset-row, and trading-panel components.
- Add unique page metadata for every content route.
- Verify key desktop and mobile screens and interactions in the running preview.
