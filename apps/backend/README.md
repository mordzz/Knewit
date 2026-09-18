# Knewit Backend

Next.js (App Router) — both the API/BFF for the Knewit mobile app (see
`../../docs/ARCHITECTURE.md` for the full system design and
`../../docs/API.md` for the endpoint contract) **and**, as of the web
port, a desktop/tablet web frontend for the same product (`src/app/sign-in`,
`src/app/page.tsx`) sharing this same Next.js project and deploy — by
request, rather than a separate `apps/web` project.

## Setup

1. `cp .env.example .env.local` and fill in:
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project's Settings -> API.
   - `PRIVY_APP_ID` / `PRIVY_APP_SECRET` — from the Privy dashboard's API Keys page (same app as the mobile client's `EXPO_PUBLIC_PRIVY_APP_ID`).
   - `NEXT_PUBLIC_PRIVY_APP_ID` — same value as `PRIVY_APP_ID`, just re-exposed under Next.js's required `NEXT_PUBLIC_` prefix for the web app's client-side Privy provider.
   - Optional, both defaulting to Polymarket's real public endpoints: `POLYMARKET_GAMMA_BASE_URL` (markets/events/categories) and `POLYMARKET_DATA_BASE_URL` (the leaderboard ranking — a different Polymarket service, `data-api.polymarket.com`).
2. Run **one file**: `supabase/all_in_one.sql` — every migration
   (`0001` … `0011`) in order, generated from the numbered files in
   `supabase/migrations/` (the canonical source, kept for history and
   referenced by code comments). Paste it into the Supabase SQL editor,
   or apply via the Supabase CLI once one is set up — not done in this
   pass. It also creates the public `profile-images` storage bucket
   (`0008`). Run it once on a fresh database; on an existing project,
   apply only the migrations you are missing (the later files are
   `IF NOT EXISTS` / `DROP IF EXISTS` style).
3. `npm install && npm run dev`

## Implemented

**Phase 1 (Foundation)** — `GET /categories`, `/events`, `/markets`,
`/markets/:id`, `/markets/:id/activity`, `/markets/:id/holders` (the last one
still a stub — empty until `Position` has rows). Live proxy to Polymarket's
Gamma API (`src/lib/polymarket/`), no caching/write-through beyond what Phase
2 needed for FK integrity (`src/lib/marketCache.ts`).

**Phase 2 (Social core)** — users/profile (`GET/PATCH /users/:id`, follow,
followers/following, posts, calls, activity), Calls/Posts (create, get, like,
comments incl. replies/share), Feed (`/feed`, `/feed/following`), Search
(`/search`, people from our DB + markets from Polymarket's `/public-search`).
`/feed`'s ranking is recency-only, a deliberate subset of docs/API.md's full
intended formula (see the route's doc comment).

**Phase 3 (Positions & Trading)** — `GET /positions`, `GET /positions/:marketId`,
`POST /trading/orders`, `GET /leaderboard`. Trading integrates the official
`@polymarket/clob-client` with a custom signer (`src/lib/trading/privyClobSigner.ts`)
that proxies EIP-712 signing to Privy's server-side wallet API
(`eth_signTypedData_v4`), so this backend never touches a private key.

`GET /leaderboard` is the one Phase 3 read that does **not** come from our
own tables: since `orders` only gets rows once a trade fills (and trading
is still unverified), its ranking is Polymarket's own live ranked
leaderboard (`src/lib/polymarket/dataApiClient.ts`), volume-only/all-time —
the same live-proxy pattern Phase 1 uses for Gamma. It is a **read-only
table**: global only (no `scope=following`), no Follow button, and no
profile link — a ranked row is a Polymarket trader identified by proxy
wallet, not an account here, and the route touches no Supabase table at all
except to fill `currentUser` from the caller's own `users.wallet_address`.
See `src/app/api/leaderboard/route.ts` and docs/DECISIONS.md, "Round 6:
Leaderboard Is a Read-Only Polymarket Ranking — No Follow, No Profile
Links".

### ⚠️ Trading is unverified end-to-end

`POST /trading/orders` requires the user's Privy embedded wallet to have
**delegated signing authority to this app** (Privy's session-signers /
delegated-actions feature). The mobile app (Sprint 6, see `docs/WALLET.md`)
only implemented wallet creation/connection — not delegation — so as it
stands today, every real order attempt is expected to fail at the signing
step with a clear error, not a fabricated success (docs/DECISIONS.md, "No
Fake Trade Success"). Before this can place a real trade:

1. The mobile app needs to add a one-time delegation step after wallet
   creation (Privy client SDK).
2. The wallet needs real USDC on Polygon and an Exchange-contract approval
   (this backend trades as a plain EOA — `SignatureType.EOA` — not a
   Polymarket-deployed proxy/Safe wallet, so funding/approval UX isn't
   automatic).
3. The whole flow needs a real test trade on a funded wallet to confirm the
   signing/order-construction sequence actually works — nothing here has
   been exercised against a real fill.

## Not yet implemented

Everything not covered above (`docs/API.md`'s full contract is the
reference); notably: `GET /markets/trending`, `GET /markets/closing-soon`,
`GET /feed/trending` (defined in docs but no current mobile consumer — see
docs/DECISIONS.md, "Redesign Round 2").

## Web (desktop/tablet)

A web port of the entire mobile app, sharing this project and its APIs
— see `docs/INTEGRATION.md` for the fuller status table.

### Pages

- `/sign-in` — email-OTP + Google/X OAuth, ported from `SignInScreen`.
  No app chrome, same as the mobile screen it's a launch gate for.
- `app/(app)/layout.tsx` — the shell every other page shares: a left
  sidebar (`src/components/Sidebar.tsx`, the desktop equivalent of the
  bottom tab bar — same five destinations, plus a "Post" button) and
  the same "Hard Login Gate" `RootNavigator` enforces on mobile
  (docs/DECISIONS.md) — signed-out visitors are redirected to
  `/sign-in`.
- `/` — Home feed (Trending/Following, real optimistic Like, links to
  author profiles/market/Call detail). No infinite scroll (first page
  only) and no Share action.
- `/markets`, `/markets/[id]` — list (category tabs sourced live from
  `GET /categories`, combo-market handling) and detail (rules,
  Callouts/Top Holders tabs, and a **real** trade form — see the
  trading caveat above; this calls the actual `POST /trading/orders`).
  No price chart.
- `/search` — People (this app's own accounts only) + Markets together,
  `localStorage`-backed Recents.
- `/leaderboard` — read-only: Polymarket's **global** ranking only (no scope
  toggle, no Follow button, no profile link — its rows are Polymarket
  traders, not accounts here). No `TopPerformers` podium — every rank is
  the same row. "Your rank" is the one personal line: the signed-in
  viewer's own standing, shown when it falls outside the loaded page.
- `/profile`, `/profile/[userId]`, `.../followers`, `.../following`,
  `/profile/edit` — one shared `ProfileView` component for self and
  anyone else (mirrors the mobile app's "One Profile Route/Screen"
  decision). Calls/Posts/Activity tabs, "Load more" instead of
  infinite scroll. Edit Profile only exposes displayName/bio, same
  scope limit as mobile.
- `/wallet` — real Privy connection state (`usePrivy().user.wallet`),
  never a fabricated balance.
- `/portfolio` — **more real than the mobile screen**: mobile's
  `PortfolioScreen` hardcodes "0 Open Positions" rather than calling
  `useMarketPosition`'s sibling hook; this page calls the real
  `GET /positions` endpoint. No PnL figure at all (not even `$0.00`) —
  this app's data model has no realized/unrealized PnL computation
  anywhere (docs/DECISIONS.md), so showing one here would be
  fabricated precision.
- `/calls/[id]` — Post/Call detail with real comments (create, delete
  own). One level deep only — no reply-to-a-reply UI, though the
  backend endpoint for it exists.
- `/create-call` — plain Post creation only, no position-picker (no
  positions exist yet in practice — Phase 3 trading is unverified — so
  there's nothing real to attach).

### Notable implementation details

- **Data fetching**: `@tanstack/react-query` (now a dependency of this
  project too, same library the mobile app uses) — this project's
  ESLint config enforces `react-hooks/set-state-in-effect`, which flags
  the plain `useEffect` + `setState` fetch pattern, so a query library
  owning that internally is the fix, not a suppression.
- **Styling**: Tailwind CSS v4 (`src/app/globals.css`'s `@theme` block),
  colors copied 1:1 from `apps/frontend/src/theme/colors.ts` so the web app
  reads as the same product. No shared package between the two — the
  values are duplicated by hand; keep them in sync manually if the palette
  changes.
- **Icons**: `react-icons` (`react-icons/io5` mirrors Ionicons, which
  `apps/frontend` uses, for anything ported later; `react-icons/fc` and
  `react-icons/fa6` for the Google/X login buttons specifically).
- **Auth**: `@privy-io/react-auth` (the web SDK, distinct from
  `@privy-io/expo`) via `src/app/providers.tsx`. Its OAuth hook
  (`useLoginWithOAuth`) works differently from the Expo one — it's a real
  full-page redirect (`initOAuth`), not an in-app-browser session that
  resolves with the user — so login completion (both email and OAuth) is
  driven by one shared `onComplete` callback rather than an awaited return
  value. Verified against the installed package's own type declarations
  while building this, not assumed from the mobile SDK's shape — see
  `src/app/sign-in/page.tsx`'s doc comment.
- `@privy-io/react-auth` pulls in a large wallet-connector dependency tree
  (wagmi, WalletConnect, MetaMask SDK, Reown AppKit, `@stripe/stripe-js` —
  none of which this app's simple email/OAuth/embedded-wallet flow uses)
  and required `--legacy-peer-deps` to install over an `ox`/`viem` version
  conflict with `@polymarket/clob-client`'s dependencies — both optional
  peers unrelated to what either package is actually used for here.
  `npm audit` reports vulnerabilities inside that same third-party
  wallet-connector tree; not run through `npm audit fix` since that can
  force breaking version changes — worth a deliberate look before a real
  deploy.

### Not built

Comment replies (the endpoint exists, no UI calls it), a Settings
sheet (Log out lives in the sidebar instead), price charts, and the
position-picker for attaching a verified position to a Call.

## Deploying to Vercel

The web frontend and the API deploy together as this one Next.js
project. This repo is **not** an npm workspace — `apps/backend` has its
own `package.json` and lockfile, so Vercel needs to be pointed at it
directly.

1. **Import the repository** in Vercel → *New Project*.
2. **Root Directory: `apps/backend`** (Edit next to the repo name).
   Framework preset: *Next.js* (auto-detected); install/build commands
   stay the defaults (`npm install`, `next build`).
3. **Node.js version**: 20.x or 22.x (`engines` requires `>=20.9.0`).
4. **Environment Variables** — add every key from `.env.example` for the
   Production environment (and Preview if you use it):
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PRIVY_APP_ID`,
   `PRIVY_APP_SECRET`, `PRIVY_AUTHORIZATION_PRIVATE_KEY`,
   `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID`,
   `NEXT_PUBLIC_PRIVY_SIGNER_ID`, and — required for trading —
   `POLYMARKET_BUILDER_API_KEY` / `POLYMARKET_BUILDER_SECRET` /
   `POLYMARKET_BUILDER_PASSPHRASE`. The `POLYMARKET_*_BASE_URL` keys are
   optional (public defaults). `NEXT_PUBLIC_*` values are inlined at
   **build time**, so set them before the first deploy; never commit
   `.env` (`.env.example` is the tracked template).
5. **Apply the Supabase SQL** — `supabase/all_in_one.sql` (migrations
   `0001` … `0011`, see Setup above). The latest endpoints depend on the
   SQL functions in `0009` / `0010` — without them, profile reads and
   follow lists answer `internal_error`.
6. **Privy dashboard**: add the production domain to *Allowed Origins*
   so email/Google/X sign-in and the embedded-wallet consent step work
   on the deployed URL (same app id as the mobile client).
7. **Deploy, then smoke-test**: sign-in (email + Google/X), feed,
   profile read, "Who to follow", wallet balance, and a deposit. Trading
   additionally needs funded Deposit Wallets plus the Builder
   credentials from step 4.
8. **Timeouts**: routes that talk to Polymarket's SDK/relayer
   (`/api/trading/*`, `/api/wallet/*`) declare `maxDuration = 60` — the
   Hobby plan's maximum. A higher limit is available on Pro if order
   placement ever needs it.

The web app calls its own `/api/*` same-origin, so no API base URL needs
to be configured here; the mobile app points at the deployed domain via
its own `EXPO_PUBLIC_API_BASE_URL`.
