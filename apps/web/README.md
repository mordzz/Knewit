# Knew It Trading Hub

design Knew It website into a polished, premium trading app with a strong crypto identity.

Knew It combines prediction markets, crypto, memecoins, perpetual futures, and tokenized stocks in one application. Prediction markets are the flagship experience. The product will be available on the web and mobile.

SCOPE
Focus on UI/UX and visual design. Inspect the existing project first and preserve working authentication, routes, integrations, and trading logic. Update existing components instead of creating an unrelated website. Use clearly labeled demo data only where real data is unavailable.

DESIGN DIRECTION
Create a distinctive, production-quality crypto interface inspired by the simplicity of consumer trading apps and the clarity of prediction markets.

Use:

Deep charcoal background, not pure black.

Slightly lighter cards and panels with subtle borders.

Vibrant yellow as the signature accent for primary actions, active navigation, and selected states.

Off-white primary text and muted gray secondary text.

Green and red reserved for market movement, outcomes, and trading states.

Clean typography such as Geist or Inter, with tabular numbers for prices.

Consistent rounded corners, restrained shadows, and crisp icons.

Keep the interface confident, compact, and easy to scan. Avoid excessive neon, gradients, glassmorphism, oversized headings, decorative crypto coins, and generic AI website styling. Use yellow selectively rather than making every element yellow.

Preserve the existing Knew It logo if available. Display the brand name as “Knew It”.

SIGN-IN PAGE
Transform the existing /sign-in page into a memorable product entrance.

Desktop:

Split composition with a branded product preview on the left and a focused sign-in panel on the right.

Headline: “Your next move starts here.”

Supporting text: “Predictions, crypto, memecoins, perps, and tokenized stocks. One app.”

Show a composed preview of a prediction market card, a small price chart, and a portfolio card.

Make these previews feel like actual pieces of the application, not random floating decorations.

Label illustrative prices and balances as demo content.

Sign-in panel:

Knew It branding.

Heading: “Welcome to Knew It”.

Clear hierarchy for existing sign-in methods.

Preserve currently supported authentication options and behavior.

Refine input fields, buttons, loading states, and validation messages.

Include existing terms and privacy links.

Mobile:

Prioritize the sign-in form.

Reduce the decorative preview to a small branded visual.

Keep the main action visible without excessive scrolling.

APPLICATION SHELL
Build a cohesive responsive app layout.

Desktop:

Left sidebar: Discover, Markets, Watchlist, Portfolio, Activity.

Brand at the top and account/settings at the bottom.

Top bar with global search, available balance, and existing funding/account controls.

Main content with a clear page title and market category tabs.

Market tabs:
Predictions / Crypto / Memecoins / Perps / Stocks

Use the label “Tokenized stocks” in relevant descriptions and detail pages so the asset type is clear.

Mobile:

Native-app-inspired layout with a compact header.

Bottom navigation: Discover, Markets, Watchlist, Portfolio.

Horizontally scrollable market category tabs.

Comfortable touch targets and safe-area spacing.

Convert dense side panels into drawers or bottom sheets.

This should be a responsive web application suitable for a future mobile product, not a static phone mockup.

DISCOVER PAGE
Make prediction markets the default focus.

Content hierarchy:

Compact featured prediction market.

Trending predictions.

Category filters: All, Crypto, Politics, Sports, Finance, Culture.

Secondary discovery sections for crypto, memecoins, perps, and tokenized stocks.

Prediction cards should include:

Relevant thumbnail.

Clear market question.

Outcome probability.

Small probability trend chart where appropriate.

Trading volume and end date.

Clearly labeled Yes / No buttons for binary markets.

A different layout for markets with multiple outcomes.

Watchlist action.

Keep cards readable and information-rich without overcrowding them. Do not let secondary asset categories overpower the prediction market experience.

MARKET VIEWS
Use a shared visual system, but tailor the information to each market type.

Crypto and memecoins:

Asset icon, name, ticker, price, percentage change, volume, and sparkline.

Memecoins may also show market cap and liquidity if available.

Perps:

Trading pair, price, daily change, funding rate, and open interest where supported.

Clear Long / Short actions and an understandable leverage selector.

Tokenized stocks:

Underlying company name, token ticker, price, and daily change.

Clearly identify the tokenized instrument.

Show market or trading-session status only when supported by real data.

MARKET DETAIL
Prediction market detail:

Question, category, closing date, and resolution information.

Probability chart with functional time-range controls.

Outcome selection and order panel.

Clearly distinguish probability, share price, order amount, and potential payout.

Explain potential payout as conditional on the selected outcome winning.

Tabs for Overview, Activity, and Rules when content is available.

Desktop order panel on the right; mobile order flow in a bottom sheet.

Other asset details:

Price chart, relevant statistics, and market-specific trading controls.

Do not use a prediction-market order form for swaps or leveraged trades.

PORTFOLIO
Design a clean unified portfolio with:

Total portfolio value.

Available balance.

Clearly labeled portfolio change over the selected period.

Allocation across market categories.

Holdings, prediction positions, and leveraged positions in appropriate separate views.

Recent activity and existing funding actions.

Use realistic formatting and distinguish open positions from completed trades.

INTERACTION AND QUALITY

Consistent hover, focus, pressed, and selected states.

Subtle 150–200 ms transitions.

Skeleton loaders, useful empty states, and clear error states.

Accessible contrast and visible keyboard focus.

Functional navigation, filters, tabs, and watchlist controls wherever supported.

Never simulate a successful trade, deposit, or authentication.

Do not add unsupported social proof, user counts, partner logos, or app-store availability claims.

Build reusable components for navigation, market cards, asset rows, buttons, filters, charts, and trading panels. Adapt the existing chart library if present.

Prioritize the sign-in page, application shell, and prediction-focused Discover page first, then extend the same design system to the remaining existing screens.

The final result should feel like a real, desirable crypto trading product: distinctive yellow branding, polished dark surfaces, clear market information, and excellent mobile usability.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/875dbd6c-fc03-47c7-b3a5-2f8b36858b62).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
