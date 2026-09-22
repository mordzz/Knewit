import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Docs · Knewit',
  description:
    'Learn how to use Knewit: explore prediction markets, manage positions, share Callouts, and use your wallet safely.',
};

const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc space-y-1 pl-5">{children}</ul>
);

export default function DocsPage() {
  return (
    <LegalPage title="Knewit Docs" effectiveDate={null}>
      <p>
        Welcome to Knewit. This guide explains how the web app works, how its main features fit together,
        and what to keep in mind when using wallets or interacting with prediction markets. The public
        web app is available today; public App Store and Google Play downloads are not available yet.
      </p>

      <LegalSection title="1. Introduction">
        <p>
          Knewit brings Polymarket prediction markets together with a community for sharing
          position-backed Callouts. You can explore markets, review outcomes and prices, manage
          supported positions, and see Polymarket&apos;s public trader ranking.
        </p>
        <p>
          Market information and trading services depend on Polymarket. Authentication and embedded
          wallet functionality depend on Privy. Those services have their own availability, terms,
          eligibility rules, and policies.
        </p>
        <p>
          This guide describes the current web experience. Trading integration is present in the app,
          but end-to-end execution has not yet been verified. Treat every trade as a financial decision
          and review the market rules and transaction details before confirming.
        </p>
      </LegalSection>

      <LegalSection title="2. Getting Started">
        <h3 className="font-semibold text-landing-ink">Use Knewit as a guest</h3>
        <p>
          Guest mode lets you explore a local demonstration without creating a real account. Its wallet,
          balances, positions, and trades are simulated; activity is not a real Polymarket transaction
          and is not saved as real account data.
        </p>
        <h3 className="font-semibold text-landing-ink">Create or access an account</h3>
        <p>
          Choose a supported sign-in method on the sign-in page. Privy handles authentication. Once a
          real session is ready, Knewit prepares the account&apos;s embedded wallet and trading
          authorization automatically. Wait for the setup screen to finish before continuing.
        </p>
        <p>
          If automatic setup cannot finish, the app shows an error and tries again on a later app open.
          Do not share a password, private key, recovery phrase, or seed phrase with Knewit or another
          user.
        </p>
        <h3 className="font-semibold text-landing-ink">Before your first transaction</h3>
        <List>
          <li>Confirm that you are in a real signed-in session, not the guest demonstration.</li>
          <li>Wait until wallet setup is complete and your wallet address is visible.</li>
          <li>Review the market rules, selected outcome, amount, and displayed estimate.</li>
          <li>Read every wallet confirmation prompt; cancel if its destination or action is unexpected.</li>
        </List>
      </LegalSection>

      <LegalSection title="3. Core Concepts">
        <h3 className="font-semibold text-landing-ink">Markets and outcomes</h3>
        <p>
          A prediction market asks a question about a future event and offers one or more outcomes. The
          market detail page shows its available choices, current prices, activity, and rules where
          provided. Prices can move as orders arrive and information changes; they are not guarantees
          that an outcome will happen.
        </p>
        <h3 className="font-semibold text-landing-ink">Price and implied probability</h3>
        <p>
          Knewit displays outcome prices in cents and may also show a percentage-style probability
          derived from the market price. For example, a price near 60¢ can be read as roughly 60% implied
          probability. This is a market signal, not an objective forecast. Prices can move, differ across
          outcomes, and be affected by available liquidity and order size. Check the unit shown beside a
          number before comparing it with another value.
        </p>
        <h3 className="font-semibold text-landing-ink">Positions</h3>
        <p>
          A position represents an outcome held in your connected trading wallet. The Wallet &amp;
          Portfolio page lists open positions with their outcome, entry price, current price when
          available, size, and estimated unrealized profit or loss.
        </p>
        <h3 className="font-semibold text-landing-ink">Callouts</h3>
        <p>
          A Callout is a short, public view connected to a position you hold. It gives other users the
          market context and outcome behind your view. A Callout is user-generated content, not a
          recommendation or a promise of performance.
        </p>
      </LegalSection>

      <LegalSection title="4. Explore Markets">
        <List>
          <li>Browse available markets and categories from the Markets area.</li>
          <li>Open a market to review its question, available outcomes, prices, activity, and rules.</li>
          <li>Use search to find markets and Knewit profiles together.</li>
          <li>Check whether a market is open and an outcome is tradeable before starting an order.</li>
        </List>
        <p>
          Market listings and detail can change or become unavailable when the upstream market provider
          updates its data. If a market has closed or resolved, Knewit disables trading for it.
        </p>
        <h3 className="font-semibold text-landing-ink">A useful market review</h3>
        <List>
          <li>Read the full question rather than relying only on a short title.</li>
          <li>Identify the exact outcome you are considering, especially in markets with several choices.</li>
          <li>Review the market&apos;s resolution rules and relevant dates when those details are provided.</li>
          <li>Compare the current price and recent activity; low activity can mean limited liquidity.</li>
          <li>Return to the market before confirming if its status or price has changed.</li>
        </List>
        <p>
          Search combines Knewit people and Polymarket markets. A person result is a Knewit profile;
          a market result opens market information. Recent searches are kept in the current app session
          and are not a permanent search history.
        </p>
      </LegalSection>

      <LegalSection title="5. Wallet and Positions">
        <p>
          The Wallet &amp; Portfolio page brings together your connected wallet address, available
          balance, open positions, and unrealized P/L when the underlying data is available. A missing
          value is shown as unavailable rather than treated as a confirmed zero.
        </p>
        <List>
          <li>Use Deposit and Withdraw to open the corresponding wallet flow.</li>
          <li>Deposit opens the wallet provider&apos;s funding flow; follow its instructions and review the funding method.</li>
          <li>Withdraw asks for a recipient EVM wallet address and a USDC amount, then requests confirmation through Privy. The displayed flow sends USDC on Polygon.</li>
          <li>Open a position to review its current state; selling submits the position for market execution.</li>
          <li>Allow time for wallet and market data to refresh after a transaction.</li>
        </List>
        <h3 className="font-semibold text-landing-ink">Reading a position</h3>
        <p>
          Entry price is the price recorded when the position was acquired. Current price is a later
          market value when available. Unrealized P/L is an estimate based on changing market data; it
          is not locked-in proceeds. Selling submits the entire displayed position for execution at
          market, so the final fill and proceeds can differ from the estimate. A successful sale may
          first credit the trading balance, with a separate transfer to the embedded wallet shown as
          its own result.
        </p>
        <p>
          Wallet and transaction features require a real signed-in account. In guest mode, wallet details
          and all trades are simulated locally. Blockchain transfers may be public and irreversible.
        </p>
      </LegalSection>

      <LegalSection title="6. Trading on a Market">
        <p>The current trade flow follows these steps:</p>
        <List>
          <li>Open an active market and choose a tradeable outcome.</li>
          <li>Enter an amount and review the price and order-book estimate shown by Knewit.</li>
          <li>Continue to confirmation and check the outcome, amount, estimated shares, and price.</li>
          <li>Confirm only when the details are correct, then wait for a result or an explicit error.</li>
        </List>
        <p>
          Estimates can change before an order fills. Execution depends on liquidity, market status,
          wallet authorization and funding, Polymarket availability, and regional eligibility. The
          trading integration has not yet been verified end-to-end, so do not assume an order has filled
          until Knewit and the connected provider confirm its status. Guest trades never use real funds.
        </p>
        <h3 className="font-semibold text-landing-ink">Why an order might not complete</h3>
        <List>
          <li>The market can close, resolve, or halt while you are preparing the order.</li>
          <li>The available order book can change, so the displayed estimate may no longer be available.</li>
          <li>Your wallet may need setup, authorization, or sufficient funds for the requested amount.</li>
          <li>A network or provider interruption can prevent submission or delay status updates.</li>
        </List>
        <p>
          If the result is unclear, revisit the market and wallet state before retrying. Do not assume
          that closing a screen cancels an order that was already submitted.
        </p>
      </LegalSection>

      <LegalSection title="7. Publish and Interact with Callouts">
        <List>
          <li>Open the Callout composer while signed in.</li>
          <li>Write a message of up to 280 characters.</li>
          <li>Attach an open position you hold; publishing stays unavailable until a position is selected.</li>
          <li>Review the attached outcome and publish. You can then read and interact with community content.</li>
        </List>
        <p>
          You can like and comment on Callouts, view replies, and follow Knewit profiles. Keep posts
          respectful and do not treat another user&apos;s Callout or performance as financial advice.
        </p>
        <h3 className="font-semibold text-landing-ink">What the attached position means</h3>
        <p>
          The attached position supplies the market, outcome, entry context, and size used to identify
          the Callout. It does not prove that the position is still open later, guarantee the author&apos;s
          future result, or make the post independently verified research. Consider the market rules
          and current prices yourself before acting.
        </p>
        <p>
          Open a Callout to read its discussion. You can add a comment or reply to a specific comment;
          available controls depend on whether you are signed in and whether the content is still
          available. Avoid posting private information or wallet credentials in public discussions.
        </p>
      </LegalSection>

      <LegalSection title="8. Profiles, Search, and Following">
        <p>
          Your profile contains your display name, username, biography, and profile images. Edit these
          details from Profile settings. Search can return people from Knewit and markets from
          Polymarket; the two results represent different account systems.
        </p>
        <p>
          Following connects Knewit accounts for social features such as a following feed. Polymarket
          trader identities shown in the leaderboard are not Knewit profiles and cannot be followed or
          opened as Knewit accounts from that list.
        </p>
        <h3 className="font-semibold text-landing-ink">Choosing a username</h3>
        <p>
          Usernames identify Knewit profiles and must be unique. If a name is already in use, choose a
          different one when editing your profile. Your display name is separate from your username.
          Keep profile details accurate and avoid using another person&apos;s identity or sensitive
          personal information.
        </p>
        <h3 className="font-semibold text-landing-ink">Following and feeds</h3>
        <p>
          Following or unfollowing changes which Knewit creators appear in the Following feed. It does
          not subscribe you to a Polymarket wallet or copy another trader&apos;s activity. You can review
          follower and following lists from a profile when those lists are available.
        </p>
      </LegalSection>

      <LegalSection title="9. Leaderboard">
        <p>
          Knewit&apos;s leaderboard displays Polymarket&apos;s global, all-time ranking by trading
          volume. It is read-only and can be paged to view more ranked traders. A row identifies a
          Polymarket trader, not a Knewit account; the list does not provide profile links or follow
          controls.
        </p>
        <p>
          Ranking and volume come from Polymarket and may change as its data changes. The figures are
          not a guarantee of future results or a measure of Knewit account performance.
        </p>
      </LegalSection>

      <LegalSection title="10. Platforms and Availability">
        <p>
          The Knewit web app is available today. A native mobile app is in development, but public App
          Store and Google Play downloads are not available yet. The responsive website can be opened
          on mobile browsers in the meantime.
        </p>
        <p>
          Features can depend on account state, wallet setup, network conditions, Polymarket service
          availability, market status, geographic restrictions, and third-party requirements. Access to
          a feature in Knewit does not by itself establish eligibility to use an underlying service.
        </p>
      </LegalSection>

      <LegalSection title="11. Security, Eligibility, and Risk">
        <List>
          <li>Never share private keys, seed phrases, recovery phrases, or wallet approval prompts.</li>
          <li>Check the market rules and transaction details before signing or submitting an order.</li>
          <li>Only use prediction-market and wallet services where you are legally eligible.</li>
          <li>Remember that prices move, liquidity can be limited, orders can fail, and losses are possible.</li>
          <li>Public blockchain transactions may be permanent and cannot be removed by Knewit.</li>
        </List>
        <p>
          Knewit provides product information and social tools, not financial, investment, legal, or tax
          advice. Privy, Polymarket, wallet providers, and blockchain networks operate under their own
          rules and policies.
        </p>
      </LegalSection>

      <LegalSection title="12. Troubleshooting">
        <h3 className="font-semibold text-landing-ink">Account setup is taking a while</h3>
        <p>
          Wallet creation and trading authorization must finish before a real account enters the app.
          Keep the app open while setup is running. If setup reports an error, reopen the app later to
          try again.
        </p>
        <h3 className="font-semibold text-landing-ink">I cannot publish a Callout</h3>
        <p>
          Confirm that you are signed in, your message is within the character limit, and you selected a
          position you currently hold.
        </p>
        <h3 className="font-semibold text-landing-ink">A market or wallet action failed</h3>
        <p>
          Check your connection, wallet setup, available balance, market status, and provider
          availability. If an order may have been submitted, check its status before trying again so
          that you do not accidentally repeat an action.
        </p>
        <h3 className="font-semibold text-landing-ink">Deposit or withdrawal did not finish</h3>
        <p>
          Check the wallet provider prompt and any transaction status or error shown in Knewit. For a
          withdrawal, verify the recipient address character by character and confirm that the recipient
          can receive USDC on Polygon. A transaction hash means a transaction was sent; it does not by
          itself mean that it has completed or that the recipient has credited it.
        </p>
        <h3 className="font-semibold text-landing-ink">My balance or position looks stale</h3>
        <p>
          Wallet and market data may update at different times. Refresh or reopen the relevant screen
          and allow the providers to return current data. If an order or transfer may already have been
          sent, check its status before submitting another one.
        </p>
        <p>
          For account, privacy, or service questions, use the official Knewit support contact provided
          in the application or on the website. See the{' '}
          <Link className="font-semibold text-landing-ink underline" href="/privacy">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link className="font-semibold text-landing-ink underline" href="/terms">
            Terms of Service
          </Link>{' '}
          for related details.
        </p>
      </LegalSection>

      <LegalSection title="13. Glossary">
        <List>
          <li><strong className="text-landing-ink">Implied probability:</strong> a probability-style reading derived from a market&apos;s current price; it is not a guarantee or objective forecast.</li>
          <li><strong className="text-landing-ink">Liquidity:</strong> the availability of buyers and sellers near the displayed price, which can affect execution and slippage.</li>
          <li><strong className="text-landing-ink">Order book:</strong> the current set of buy and sell interest used to estimate whether and at what price an order may execute.</li>
          <li><strong className="text-landing-ink">Unrealized P/L:</strong> estimated profit or loss on an open position that has not been sold.</li>
          <li><strong className="text-landing-ink">Outcome:</strong> one possible result offered by a market.</li>
          <li><strong className="text-landing-ink">Position:</strong> an outcome held in a connected trading wallet.</li>
          <li><strong className="text-landing-ink">Callout:</strong> a short community post attached to a position.</li>
          <li><strong className="text-landing-ink">Guest mode:</strong> a local demonstration with simulated wallet and trading activity.</li>
          <li><strong className="text-landing-ink">Trading balance:</strong> funds reflected in the market trading system; this can be shown separately from the embedded wallet balance.</li>
          <li><strong className="text-landing-ink">Transaction hash:</strong> a public identifier for a submitted blockchain transaction, not proof that it succeeded.</li>
          <li><strong className="text-landing-ink">Leaderboard:</strong> Polymarket&apos;s public all-time ranking shown inside Knewit.</li>
        </List>
      </LegalSection>
    </LegalPage>
  );
}
