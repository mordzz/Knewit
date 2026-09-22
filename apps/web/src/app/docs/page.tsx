import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Knewit Product Documentation',
  description:
    'Product guide and technical overview for Knewit: prediction markets, wallet and portfolio, position-backed Callouts, architecture, and security.',
};

const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc space-y-1 pl-5">{children}</ul>
);

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-landing-ink/10">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm leading-6">
        <thead className="bg-landing-paper text-landing-ink">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="border-b border-landing-ink/10 px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top even:bg-landing-paper/50">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="border-b border-landing-ink/5 px-4 py-3 last:border-b-0"
                >
                  {cellIndex === 0 ? <strong className="font-semibold text-landing-ink">{cell}</strong> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const subheadingClass = 'font-semibold text-landing-ink';

export default function DocsPage() {
  return (
    <LegalPage title="Knewit Product Documentation" effectiveDate={null}>
      <p>
        Product guide, user workflows, feature status, and a technical overview for the Knewit team.
        Knewit brings prediction markets, trading positions, a wallet, and social conversation into
        one web experience. Its defining idea is the position-backed Callout: a public opinion with
        visible market context attached.
      </p>

      <DataTable
        headers={['Document information', 'Details']}
        rows={[
          ['Version', '1.0'],
          ['Document date', 'September 22, 2026'],
          ['Prepared for', 'Product development, product presentation, and team onboarding'],
          [
            'Web application',
            <a
              href="https://dekstop-pd32sv76a-dzakaals-projects.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-landing-ink underline"
            >
              Open the Knewit web application
            </a>,
          ],
          ['Interface language', 'English'],
          ['Current product shape', 'Active web application with guest demonstrations and some simulated activity'],
        ]}
      />

      <LegalSection title="1. Product Overview">
        <h3 className={subheadingClass}>Purpose</h3>
        <p>
          Knewit helps people discover prediction markets, understand market prices, manage positions,
          and share their views with a community. Market discovery, wallet and portfolio information,
          and social discussion are organized in one application.
        </p>
        <h3 className={subheadingClass}>Product principles</h3>
        <List>
          <li><strong className="text-landing-ink">Market discovery:</strong> browse markets and current categories supplied by the market data provider.</li>
          <li><strong className="text-landing-ink">Position-backed discussion:</strong> a Callout must reference a position held by its author.</li>
          <li><strong className="text-landing-ink">Unified portfolio:</strong> view wallet balance, open positions, and estimated unrealized P/L together.</li>
          <li><strong className="text-landing-ink">Social layer:</strong> follow Knewit accounts, react to Callouts, and join their comment threads.</li>
          <li><strong className="text-landing-ink">Low-friction access:</strong> sign in through configured identity providers or explore supported demo flows as a guest.</li>
        </List>
        <h3 className={subheadingClass}>Product areas</h3>
        <DataTable
          headers={['Area', 'Purpose']}
          rows={[
            ['Prediction markets', 'Market questions, outcomes, prices, activity, and provider-supplied details.'],
            ['Social Callouts', 'Community posts attached to a position, with likes and comments.'],
            ['Wallet and portfolio', 'Wallet information, balance, open positions, and estimated P/L.'],
            ['Activity and profiles', 'A user activity feed and public profile information.'],
            ['Leaderboard', 'A read-only view of Polymarket’s global all-time volume ranking.'],
            ['Settings and legal', 'Profile editing, wallet actions, Privacy Policy, Terms, and FAQ access.'],
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Users and Access Modes">
        <DataTable
          headers={['User type', 'What they can do', 'Notes']}
          rows={[
            ['Guest', 'Explore the interface and use supported demo flows.', 'Wallet, positions, trades, and supported posts are simulated and are not real transactions.'],
            ['Authenticated user', 'Use account-backed profile and social features.', 'Email, Google, and X sign-in are presented in the UI; successful use depends on Privy deployment and provider configuration.'],
            ['Trading user', 'Use wallet, balance, position, and trade actions where enabled.', 'Availability depends on wallet setup, backend and market services, regional eligibility, and provider rules.'],
            ['Admin or operator', 'Operate or monitor application services.', 'An admin panel is not present in the inspected web application.'],
          ]}
        />
        <h3 className={subheadingClass}>Sign-in flow</h3>
        <List>
          <li>Open the Knewit landing page and choose the web app entry point.</li>
          <li>Choose an available sign-in provider, or select guest mode to enter the demonstration.</li>
          <li>After authentication, allow the app to complete embedded-wallet and trading authorization setup.</li>
          <li>The app opens the Callouts feed; use the navigation to move between markets, wallet, activity, leaderboard, profile, and settings.</li>
        </List>
        <p>
          Guest mode is for product exploration. It does not represent account data or ownership of
          funds or market positions. Public App Store and Google Play downloads are not currently
          available; the responsive web application can be used in a mobile browser.
        </p>
      </LegalSection>

      <LegalSection title="3. Navigation and User Guide">
        <DataTable
          headers={['Section', 'Purpose', 'Common actions']}
          rows={[
            ['Callouts', 'Read and publish position-backed views.', 'Trending and Following feeds, like, comment, reply, attach position.'],
            ['Markets', 'Discover prediction markets.', 'Browse Trending and provider categories; open market details and outcomes.'],
            ['Wallet', 'Review wallet and portfolio information.', 'View balance and positions; open deposit, withdrawal, or sell flows.'],
            ['Activity', 'Review account activity.', 'Open related market, Callout, or profile items.'],
            ['Leaderboard', 'Browse Polymarket’s ranked traders.', 'Load more ranks; no Knewit profile or follow action is provided.'],
            ['Profile', 'View or edit Knewit account information.', 'Review public profile details, Callouts, activity, followers, and following.'],
            ['Settings', 'Manage account and access help or legal information.', 'Edit profile, deposit, withdraw, open Privacy Policy, Terms, and FAQ.'],
          ]}
        />
        <h3 className={subheadingClass}>Find and review a market</h3>
        <List>
          <li>Open Markets or use global search, which can return both markets and Knewit people.</li>
          <li>Browse Trending or a category supplied by the current market taxonomy.</li>
          <li>Open a market and read its full question, outcomes, prices, activity, and resolution rules when available.</li>
          <li>Confirm the market is open and the selected outcome is tradeable before beginning an order.</li>
        </List>
        <p>
          Prices are denominated in cents and may also be presented as a market-implied probability.
          A price near 60¢ is approximately a 60% implied probability, not a guarantee or objective
          forecast. Prices move with market activity; liquidity and order size affect execution.
        </p>
        <h3 className={subheadingClass}>Place or sell a position</h3>
        <List>
          <li>Select a tradeable outcome and enter an amount.</li>
          <li>Review the order-book estimate, selected outcome, amount, estimated shares, and price.</li>
          <li>Confirm through the wallet flow and wait for a provider result before treating the order as complete.</li>
          <li>In Wallet, review entry price, current price when available, size, and estimated unrealized P/L.</li>
          <li>Selling submits the whole displayed position for market execution; final fill and proceeds can differ from an estimate.</li>
        </List>
        <p>
          The web trading flow is implemented but has not been verified end-to-end for production
          execution. Do not assume an order filled unless Knewit and the connected provider report its
          status. In guest mode, trades only change simulated demo data.
        </p>
        <h3 className={subheadingClass}>Publish a Callout and join a discussion</h3>
        <List>
          <li>Sign in and open the Callout composer.</li>
          <li>Write a message of up to 280 characters.</li>
          <li>Attach a position you hold; publishing remains disabled until a valid position is selected.</li>
          <li>Review the attached market and outcome, then publish.</li>
          <li>Open a Callout to like it, comment, reply, and visit its author’s profile.</li>
        </List>
        <p>
          An attached position supplies context; it is not independent verification, a promise of
          performance, or financial advice. A position may change or close after publication.
        </p>
        <h3 className={subheadingClass}>Wallet, search, and social features</h3>
        <p>
          Deposit opens the funding provider flow. Withdraw asks for a recipient EVM address and USDC
          amount, then requests confirmation through Privy for a Polygon transfer. Verify the network
          and recipient carefully; blockchain transfers may be public and irreversible. Wallet balance
          and trading balance can be reported separately.
        </p>
        <p>
          Profile usernames must be unique and are separate from display names. Search combines Knewit
          people with Polymarket markets. Following Knewit accounts affects the Following feed; it does
          not subscribe to or copy Polymarket wallet activity. Recent searches are session-scoped, not
          a permanent search history.
        </p>
      </LegalSection>

      <LegalSection title="4. Feature Status">
        <p>
          This table describes the web implementation inspected for this document. A route or visible
          control does not by itself guarantee that every provider, environment, or real-funds flow is
          configured and available.
        </p>
        <DataTable
          headers={['Feature', 'Status', 'Implementation notes']}
          rows={[
            ['Landing page', 'Available', 'Introduces Knewit, market concepts, product flow, FAQ, and entry points.'],
            ['Email, Google, and X sign-in', 'UI available; provider-dependent', 'Real authentication requires valid Privy credentials and enabled provider configuration.'],
            ['Guest mode', 'Available as a demonstration', 'Wallet, trade, and supported social activity is simulated; it is not real account or transaction data.'],
            ['Callouts and social interactions', 'Implemented', 'Feed, position-backed publishing, likes, comments/replies, and following use account-backed services; guest behavior is simulated where supported.'],
            ['Markets and search', 'Implemented with upstream data', 'Market list and detail depend on Polymarket data and availability; categories follow provider taxonomy.'],
            ['Wallet and portfolio', 'Implemented; provider-dependent', 'Displays wallet and position information and offers deposit, withdrawal, and sale flows. Real trade execution has not been verified end-to-end.'],
            ['Activity and profiles', 'Implemented', 'Routes display account activity and profile information backed by application services.'],
            ['Leaderboard', 'Available; read-only', 'Polymarket global all-time ranking by trading volume; rows are Polymarket traders, not Knewit profiles.'],
            ['Settings and legal pages', 'Available', 'Profile editing, wallet actions, Privacy Policy, Terms, and FAQ link are present.'],
            ['Admin panel', 'Not present in inspected web app', 'Operations and moderation tools are not exposed as an admin dashboard here.'],
          ]}
        />
        <h3 className={subheadingClass}>Important validation rules</h3>
        <List>
          <li>A Callout needs non-empty text within the character limit and a position owned by the signed-in user.</li>
          <li>Guest activity must remain distinct from authenticated account and transaction data.</li>
          <li>Order and transfer success must reflect provider or backend status, not an optimistic UI-only change.</li>
          <li>Missing wallet values must not be represented as a confirmed zero balance.</li>
          <li>Market prices, P/L, and balances can change and depend on data freshness and provider availability.</li>
        </List>
      </LegalSection>

      <LegalSection title="5. System Architecture">
        <DataTable
          headers={['Component', 'Current role']}
          rows={[
            ['Web client', 'Next.js App Router and React pages for landing, authentication, markets, social feeds, wallet, and profiles.'],
            ['Backend for frontend', 'Next.js API routes authenticate requests, apply application rules, normalize upstream data, and return client-facing responses.'],
            ['Privy', 'Authentication, embedded wallet lifecycle, and wallet authorization/signing flows.'],
            ['Polymarket services', 'Gamma and related endpoints supply market metadata; CLOB-related services support order-book estimates and trading; Data API supplies the leaderboard.'],
            ['Supabase', 'Server-side application storage for profiles, Callouts, comments, likes, follows, activity, and related records.'],
            ['TanStack Query', 'Client-side request state, caching, pagination, and refresh for server data.'],
            ['Mobile application', 'A separate native client exists in the repository; public app-store release is not available at the time of this document.'],
          ]}
        />
        <h3 className={subheadingClass}>Typical data flow</h3>
        <List>
          <li>The client requests application data from a Knewit API route.</li>
          <li>The server validates the session and checks the caller’s access to the requested action or record.</li>
          <li>For market data, the server reads or normalizes provider data; social data is read from application storage.</li>
          <li>For a trade, the server validates the market, outcome, amount, wallet authorization, and applicable availability.</li>
          <li>The wallet authorizes actions requiring user consent; the backend and provider determine the resulting status.</li>
          <li>The client refreshes affected balance, position, market, and activity views from authoritative responses.</li>
        </List>
        <p>
          Keep social application logic separate from market data and trade execution. Polymarket’s
          leaderboard is an external, read-only global ranking: it uses all-time volume only, exposes
          no Knewit follow state or profile links, and does not rank Knewit users by P/L.
        </p>
      </LegalSection>

      <LegalSection title="6. Data and Security">
        <h3 className={subheadingClass}>Conceptual data model</h3>
        <p>This table is a product-level model for discussion, not a promise of exact database column names or schema.</p>
        <DataTable
          headers={['Entity', 'Typical information']}
          rows={[
            ['User', 'Application identity, unique username, display name, avatar, biography, and timestamps.'],
            ['Wallet', 'Provider, public wallet address, network, and setup or connection state.'],
            ['Market cache', 'Provider market ID, question, category, outcomes, prices, status, and update time.'],
            ['Position and order', 'User, market, outcome, entry or order details, size, provider identifiers, status, and timestamps.'],
            ['Callout', 'Author, required position reference, text, market context, and creation time.'],
            ['Comment, like, and follow', 'User relationships and social interaction records with timestamps.'],
            ['Activity', 'User, activity type, related record, metadata, and creation time.'],
          ]}
        />
        <h3 className={subheadingClass}>Security principles</h3>
        <List>
          <li>Privy manages embedded user wallets; Knewit must not request or expose a user’s private key or recovery phrase.</li>
          <li>Keep Supabase service-role credentials, Privy server authorization keys, and provider secrets in backend environment configuration only.</li>
          <li>Authenticate and authorize sensitive API actions, including ownership checks for positions and user content.</li>
          <li>Validate and sanitize Callout, comment, username, and search inputs; apply rate limits and operational logging where appropriate.</li>
          <li>Verify provider and webhook results before changing order or portfolio state; calculate sensitive transaction values on the server.</li>
          <li>Public blockchain records can be permanent and cannot be removed by Knewit.</li>
          <li>Explain market, wallet, legal eligibility, and financial risks before enabling real-money features.</li>
        </List>
        <h3 className={subheadingClass}>Order lifecycle reference</h3>
        <p>
          The following is a recommended vocabulary for product and engineering discussions. It is a
          conceptual lifecycle, not a claim that every state is currently surfaced in the Knewit UI.
        </p>
        <DataTable
          headers={['State', 'Meaning']}
          rows={[
            ['Draft', 'Order details are being prepared.'],
            ['Awaiting signature', 'The wallet is waiting for user authorization.'],
            ['Submitted', 'The order was sent to the market venue.'],
            ['Partial fill', 'Some, but not all, of the order has executed.'],
            ['Filled', 'The order has completed execution.'],
            ['Cancelled or failed', 'The order did not complete; show a safe, useful reason when available.'],
            ['Resolved', 'The market resolved and the resulting position or payout was reconciled.'],
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Testing and Development Roadmap">
        <h3 className={subheadingClass}>Minimum verification scenarios</h3>
        <DataTable
          headers={['Area', 'Scenarios to cover', 'Expected result']}
          rows={[
            ['Authentication', 'Email, configured social providers, guest, logout, expired session.', 'Correct account/session state; no guest data presented as real account data.'],
            ['Markets', 'Load, category, search, pagination, empty response, and provider error.', 'Current data or clear loading, empty, and retryable error states.'],
            ['Trading', 'Tradeable outcome, invalid/minimum amount, insufficient funds, retry, and uncertain submission.', 'No duplicate order; UI follows backend/provider status.'],
            ['Callouts', 'Empty text, 280 characters, over limit, no position, and a position not owned by the user.', 'Invalid submissions are blocked and ownership is enforced server-side.'],
            ['Wallet', 'Deposit, withdrawal, sale, pending/failure, refresh, and unavailable balance.', 'Correct network and transaction context; no fabricated balance or success.'],
            ['Social', 'Like/unlike, comment/reply, follow/unfollow, and unavailable content.', 'Changes persist once and access rules are respected.'],
            ['Responsive and accessibility', 'Desktop, tablet, mobile, keyboard navigation, and screen-reader labels.', 'Content remains readable and actions are reachable at each viewport.'],
            ['Security', 'Unauthenticated requests, wrong-owner access, malicious text, rate limiting, and tampered transaction input.', 'Requests are rejected safely without exposing credentials or secrets.'],
          ]}
        />
        <h3 className={subheadingClass}>Suggested development sequence</h3>
        <List>
          <li>Continue stabilizing authentication, wallet setup, and session transitions across web and mobile.</li>
          <li>Maintain reliable market discovery, detail, search, pagination, and clear loading/empty/error states.</li>
          <li>Complete and verify the trading pipeline end-to-end in an appropriate environment with traceable order status.</li>
          <li>Reconcile wallet balances, positions, and transactions against authoritative providers.</li>
          <li>Strengthen persistence and operational behavior for Callouts, comments, likes, follows, and activity.</li>
          <li>Define leaderboard scope and metrics before introducing any Knewit-specific ranking.</li>
          <li>Expand moderation, reporting, audit trails, monitoring, and regional/legal review before broader real-money release.</li>
        </List>
        <h3 className={subheadingClass}>Definition of done</h3>
        <List>
          <li>Acceptance criteria and applicable scenarios have been tested.</li>
          <li>Loading, success, empty, and error states are clear.</li>
          <li>No secrets or sensitive values appear in client bundles or logs.</li>
          <li>Desktop and mobile layouts have been checked.</li>
          <li>API contracts and database changes are documented when applicable.</li>
          <li>Monitoring and error reporting are in place for production-critical flows.</li>
          <li>Features involving funds or eligibility show the appropriate disclosures.</li>
        </List>
      </LegalSection>

      <LegalSection title="8. Glossary and Further Reading">
        <DataTable
          headers={['Term', 'Definition']}
          rows={[
            ['Callout', 'A short community post attached to a position held by its author.'],
            ['Outcome', 'One possible result offered by a prediction market.'],
            ['Implied probability', 'A probability-style interpretation of market price; it is not a guaranteed forecast.'],
            ['Liquidity', 'Availability of trading interest near a displayed price, which can affect execution.'],
            ['Order book', 'Buy and sell interest used to estimate a market order’s execution price.'],
            ['Position', 'An outcome exposure held in a connected trading account or represented in demo data.'],
            ['Unrealized P/L', 'Estimated profit or loss on an open position that has not been sold.'],
            ['Trading balance', 'Funds available in the trading system, which can be reported separately from the embedded wallet balance.'],
            ['Transaction hash', 'A public identifier for a submitted blockchain transaction; it does not alone prove successful completion.'],
            ['Guest mode', 'A local product demonstration with simulated wallet and supported trading/social activity.'],
          ]}
        />
        <p>
          Knewit provides product information and social features, not financial, investment, legal,
          or tax advice. Market and wallet services have their own terms, eligibility rules, and
          availability. Use them only where you are legally eligible and review the market rules and
          transaction details before acting.
        </p>
        <p>
          Read the <Link className="font-semibold text-landing-ink underline" href="/privacy">Privacy Policy</Link>{' '}
          and <Link className="font-semibold text-landing-ink underline" href="/terms">Terms of Service</Link>.
          For account or service questions, use an official Knewit support contact if one is provided
          in the application or on the website.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
