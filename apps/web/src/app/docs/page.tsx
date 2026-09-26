import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Knewit Documentation',
  description:
    'Knewit user guide for markets, Callouts, account setup, wallet deposits, portfolio, and troubleshooting.',
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
    <LegalPage title="Documentation" effectiveDate={null}>
      <p>
        A complete guide to using Knewit, from discovering markets to managing your wallet and sharing a Callout.
        Knewit brings prediction markets, trading positions, a wallet, and social conversation into
        one web experience. Its defining idea is the position-backed Callout: a public opinion with
        visible market context attached.
      </p>

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
          <li><strong className="text-landing-ink">Account access:</strong> sign in through configured identity providers.</li>
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
        <h3 className={subheadingClass}>What you will see in a market</h3>
        <DataTable
          headers={['Information', 'How to read it']}
          rows={[
            ['Question', 'The event or statement the market is asking about. Read it in full before choosing an outcome.'],
            ['Outcome', 'A possible answer to the market question, such as Yes or No.'],
            ['Price', 'The current market price for an outcome. It can be viewed as the market’s current probability-style estimate.'],
            ['Activity', 'Recent interest and movement around the market. Activity can help show how actively a market is being discussed or traded.'],
            ['Resolution rules', 'The rules and source used to determine the final outcome when they are available.'],
          ]}
        />
        <p>
          Knewit helps you read and discuss market information. It does not tell you what outcome to choose.
          Take time to read the question, the resolution rules, and the information shown before you act.
        </p>
      </LegalSection>

      <LegalSection title="2. Users and Access Modes">
        <DataTable
          headers={['User type', 'What they can do', 'Notes']}
          rows={[
            ['Authenticated user', 'Use account-backed profile and social features.', 'Email, Google, and X sign-in are presented in the UI; successful use depends on Privy deployment and provider configuration.'],
            ['Trading user', 'Use wallet, balance, position, and trade actions where enabled.', 'Availability depends on wallet setup, market availability, regional eligibility, and provider rules.'],
          ]}
        />
        <h3 className={subheadingClass}>Sign-in flow</h3>
        <List>
          <li>Open the Knewit landing page and choose the web app entry point.</li>
          <li>Choose an available sign-in provider.</li>
          <li>After authentication, allow the app to complete embedded-wallet and trading authorization setup.</li>
          <li>When setup finishes, the app continues to Callouts automatically. If the wallet is still provisioning, keep the app open briefly; if it remains stuck, retry the session and contact support with the displayed error code.</li>
          <li>The app opens the Callouts feed; use the navigation to move between markets, wallet, activity, leaderboard, profile, and settings.</li>
        </List>
        <p>
          Knewit is available as a mobile app and as a responsive web application, so you can use the same
          account across supported devices. For public iOS and Android release information, open the{' '}
          <Link href="/download" className="font-semibold underline underline-offset-4">Download page</Link>.
          {' '}It shows the current App Store and Google Play status, while the web app remains available from a
          supported mobile or desktop browser.
        </p>
        <h3 className={subheadingClass}>Choose the right access mode</h3>
        <DataTable
          headers={['If you want to…', 'Use this mode']}
          rows={[
            ['Create a profile, follow people, and participate with your account', 'Sign in with an available provider.'],
            ['Use wallet or trading actions', 'Sign in, complete any required wallet setup, and confirm that the action is available to you.'],
          ]}
        />
        <p>
          If wallet setup is still in progress, keep Knewit open briefly. If it does not finish, restart the
          session and use any safe error code shown by the app when seeking support. Never share passwords,
          recovery phrases, private keys, or one-time codes.
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
        <h3 className={subheadingClass}>Before choosing an outcome</h3>
        <List>
          <li>Read the wording carefully. Small details such as a date, threshold, location, or source can change what the market resolves to.</li>
          <li>Review every available outcome so you understand the alternatives.</li>
          <li>Check the current price and the estimate for your selected amount. A displayed price can change before an order executes.</li>
          <li>Use only funds and positions you understand. Market prices can move quickly and the value of a position can decrease.</li>
        </List>
        <h3 className={subheadingClass}>Place or sell a position</h3>
        <List>
          <li>Select a tradeable outcome and enter an amount.</li>
          <li>Review the order-book estimate, selected outcome, amount, estimated shares, and price.</li>
          <li>Confirm through the wallet flow and wait for a provider result before treating the order as complete.</li>
          <li>In Wallet, review entry price, current price when available, size, and estimated unrealized P/L.</li>
          <li>Selling submits everything you hold in that outcome for market execution; final fill and proceeds can differ from an estimate. Proceeds stay in your trading balance (pUSD) for another trade or withdrawal.</li>
          <li>When a market resolves in your favour, the position shows Redeem instead of Sell. Redeeming turns the winning shares into trading balance.</li>
        </List>
        <p>
          Do not assume an order filled until Knewit and the connected provider report its status.
        </p>
        <h3 className={subheadingClass}>After you submit</h3>
        <p>
          Submission is not the same as completion. Wait for the status shown by Knewit and the connected service.
          When a position is visible in Wallet, review its outcome, size, entry price, and current value. Estimated
          P/L is informational and can change with market price; it is not a promise of the amount you will receive.
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
        <h3 className={subheadingClass}>Write useful Callouts</h3>
        <List>
          <li>State the idea or evidence behind your view in clear language.</li>
          <li>Use the attached market and outcome to give readers the context they need.</li>
          <li>Remember that a Callout remains a personal view, even when it is backed by a position.</li>
          <li>Keep discussion constructive. Open the Callout to reply, visit the author’s profile, or add a comment to the thread.</li>
        </List>
        <h3 className={subheadingClass}>Fund your wallet</h3>
        <p>
          Select Deposit from Wallet, Settings, or the app header. Pick a Token and a Chain from the two dropdowns
          each chain lists its minimum deposit  then send exactly that token on that chain to the address shown (copy
          it or scan the QR code). Deposits go through Polymarket’s bridge and arrive as pUSD, your trading balance,
          usually within a minute or two.
        </p>
        <List>
          <li>Open Wallet, Settings, or use Deposit in the app header.</li>
          <li>Choose the Token and Chain you will send from, and check the minimum for that chain.</li>
          <li>Send from your exchange or wallet to the deposit address shown, on the same chain.</li>
          <li>Keep the sheet open to follow the status, or close it; your balance updates when the deposit completes.</li>
        </List>
        <p>
          Sending a different token, using a different chain, or sending less than the minimum can mean the deposit is
          not processed. Bridge costs are taken from the deposited amount.
        </p>
        <h3 className={subheadingClass}>Withdraw funds</h3>
        <p>
          Withdraw uses the same Token and Chain pickers. Enter the recipient address on that chain and an amount in
          USD; Knewit shows what the recipient should receive and the route cost before you confirm. Review the full
          address and chain  Knewit can check an address’s format, but not who owns it. Transfers are public and
          irreversible.
        </p>
        <h3 className={subheadingClass}>Search, profiles, and following</h3>
        <p>
          Profile usernames must be unique and are separate from display names. Search combines Knewit
          people with Polymarket markets. Following Knewit accounts affects the Following feed; it does
          not subscribe to or copy Polymarket wallet activity. Recent searches are session-scoped, not
          a permanent search history.
        </p>
        <List>
          <li>Use Search when you know the market question or person you are looking for.</li>
          <li>Open a profile to see public information, Callouts, activity, followers, and following.</li>
          <li>Follow an account to include its Callouts in the Following feed.</li>
          <li>Open Activity to return to related markets, Callouts, or people you have interacted with.</li>
        </List>
      </LegalSection>

      <LegalSection title="4. Reading a Market">
        <h3 className={subheadingClass}>Start with the question</h3>
        <p>
          The market question is the source of truth for what is being discussed. Read the whole sentence before
          looking at a price. Pay attention to the date, location, threshold, named person or organization, and any
          condition in the wording. A market can sound familiar while asking a more specific question than expected.
        </p>
        <h3 className={subheadingClass}>Review the outcomes</h3>
        <p>
          Outcomes are the possible answers offered by the market. Select an outcome only after you understand how
          it relates to every other option. The displayed price reflects current market activity and may move before
          an order completes. It is useful context for a decision, but it does not promise a future result.
        </p>
        <h3 className={subheadingClass}>Check the resolution rules</h3>
        <List>
          <li>Find the rule or source used to determine the outcome, when it is available on the market.</li>
          <li>Check whether the market is still open and whether the selected outcome is tradeable.</li>
          <li>Review the current activity and price without assuming that recent movement will continue.</li>
          <li>Return to the full market detail whenever a card or search result does not give enough context.</li>
        </List>
      </LegalSection>

      <LegalSection title="5. Placing a Trade">
        <h3 className={subheadingClass}>Choose an amount</h3>
        <p>
          After selecting a tradeable outcome, enter the amount you want to use. Knewit shows an estimate based on
          the information available at that time. Review the amount, selected outcome, estimated shares, and price
          before continuing. Estimates help you understand an order; the final result can differ when the market moves
          or when there is limited trading interest at that price.
        </p>
        <h3 className={subheadingClass}>Review and confirm</h3>
        <List>
          <li>Confirm that the market question and outcome match the view you intend to express.</li>
          <li>Check the amount against your available trading balance.</li>
          <li>Read the estimate and any confirmation details before authorizing the action.</li>
          <li>Wait for the displayed status to update. Do not repeat the order while it is pending.</li>
        </List>
        <h3 className={subheadingClass}>What happens next</h3>
        <p>
          A successful confirmation sends the order for processing. Knewit can show submitted, pending, confirmed,
          or failed information when it is available. If an order does not complete, use the status shown by Knewit
          and the connected service to decide what to do next.
        </p>
      </LegalSection>

      <LegalSection title="6. Managing Positions">
        <h3 className={subheadingClass}>Use Wallet to review open positions</h3>
        <p>
          Each open position can show the market, outcome, size, entry price, current price when available, and
          estimated unrealized P/L. These values are designed to help you understand your current exposure. They can
          change with the market and should not be treated as a final settlement amount.
        </p>
        <h3 className={subheadingClass}>Selling a position</h3>
        <p>
          Open the relevant position and use the sell action where it is available. Selling closes everything you hold
          in that outcome. Review the market, outcome, and estimate before confirming. A sell order is still subject to
          market execution, so the final fill and proceeds can differ from the initial estimate. Proceeds remain in the
          trading balance for another eligible action or withdrawal.
        </p>
        <h3 className={subheadingClass}>When a market resolves</h3>
        <p>
          A market resolves according to its stated rules and source. A resolved market is no longer a normal open
          trading decision. If your outcome won, the position shows a Redeem action: redeeming turns the winning
          shares into trading balance. Losing positions are worth nothing and disappear from the portfolio. Positions,
          prices and P/L are read from Polymarket, so they also reflect activity made outside Knewit.
        </p>
      </LegalSection>

      <LegalSection title="7. Creating Callouts">
        <h3 className={subheadingClass}>What makes a Callout different</h3>
        <p>
          A Callout connects a short public view to a position held by its author. The attached market and outcome
          help readers see the context behind the post. It does not prove that a view is correct, and it does not
          guarantee that a position remains open after publication.
        </p>
        <h3 className={subheadingClass}>Publish step by step</h3>
        <List>
          <li>Open the Callout composer after signing in.</li>
          <li>Write a clear message of up to 280 characters.</li>
          <li>Select a valid position you hold. Publishing remains unavailable until a position is attached.</li>
          <li>Read the attached market and outcome one more time, then publish.</li>
        </List>
        <h3 className={subheadingClass}>Write for other readers</h3>
        <p>
          Explain the observation, question, or reasoning behind your view in language another person can understand.
          Avoid presenting a market price, a past result, or a Callout as financial advice. Readers can open the
          attached market, comment, and decide what they think independently.
        </p>
      </LegalSection>

      <LegalSection title="8. Community and Profiles">
        <h3 className={subheadingClass}>Participate in discussion</h3>
        <p>
          Open a Callout to like it, comment, reply to another comment, or visit its author’s profile. Comments and
          replies keep the conversation connected to the original view. Use them to add context, ask a question, or
          share a considered response.
        </p>
        <h3 className={subheadingClass}>Follow people and read feeds</h3>
        <List>
          <li>The Trending feed helps you discover active Callouts.</li>
          <li>The Following feed shows Callouts from Knewit accounts you follow.</li>
          <li>Following affects Knewit’s social experience only. It does not copy, track, or subscribe to another person’s market activity.</li>
          <li>Use a public profile to review someone’s Callouts, activity, followers, and following before deciding whether to follow them.</li>
        </List>
        <h3 className={subheadingClass}>Your public profile</h3>
        <p>
          Your username is unique and separate from your display name. Review profile edits carefully because public
          profile information can be seen by other Knewit users. You can use Settings to update supported profile
          details and Activity to revisit actions connected to your account.
        </p>
      </LegalSection>

      <LegalSection title="9. Depositing Funds">
        <h3 className={subheadingClass}>Before you begin</h3>
        <p>
          Confirm that you are signed in and your wallet setup is ready. Deposits use Polymarket’s bridge: every token
          and chain it supports is listed in the Deposit pickers, together with its minimum. Everything you send is
          converted and credited as pUSD, Polymarket’s trading balance.
        </p>
        <h3 className={subheadingClass}>Deposit step by step</h3>
        <List>
          <li>Open Wallet or Settings, or choose Deposit from the app header.</li>
          <li>Choose the Token you hold and the Chain you will send it on. The Chain list shows each minimum.</li>
          <li>Copy the deposit address (or scan the QR code) and send the token from your exchange or wallet.</li>
          <li>Wait for the status to change from “Deposit detected” to “Deposit added to your balance”.</li>
        </List>
        <DataTable
          headers={['Address type', 'Used for']}
          rows={[
            ['EVM (0x…)', 'Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Smart Chain and other EVM chains in the list.'],
            ['Solana', 'Solana tokens such as USDC, USDT or SOL.'],
            ['Bitcoin', 'BTC on the Bitcoin network.'],
            ['Tron', 'USDT or TRX on Tron.'],
          ]}
        />
        <p>
          Only send the token and chain you selected, and at least the minimum. Bridge costs come out of the deposit.
          If a deposit fails or you sent the wrong token, contact support with the transaction hash  Polymarket
          provides a recovery process for some mistakes, but recovery is not guaranteed.
        </p>
      </LegalSection>

      <LegalSection title="10. Withdrawing Funds">
        <h3 className={subheadingClass}>Check the destination first</h3>
        <p>
          A withdrawal sends your trading balance through Polymarket’s bridge and delivers the Token and Chain you
          choose to the address you enter. Review every character of the address and the chain before confirming. An
          address can be valid in format without belonging to the person you intended to pay.
        </p>
        <h3 className={subheadingClass}>Confirm the transfer</h3>
        <List>
          <li>Open Withdraw from Wallet, Settings, or the app header.</li>
          <li>Choose the Token and Chain to receive; the Chain list shows the minimum.</li>
          <li>Enter the recipient address on that chain and the amount in USD.</li>
          <li>Check “You receive” and the route cost, review, then confirm.</li>
          <li>Wait until the status shows the funds were delivered before considering the transfer complete.</li>
        </List>
        <p>
          A blockchain transfer is public and irreversible. Never withdraw to an address you do not understand or have
          not verified. If a transfer is pending, keep the transaction reference and wait for the final status rather
          than submitting the same transfer again.
        </p>
      </LegalSection>

      <LegalSection title="11. Search, Activity, and Leaderboard">
        <h3 className={subheadingClass}>Search</h3>
        <p>
          Global search can return both Knewit people and prediction markets. Use a distinctive word from a market
          question or a username to narrow the result. Recent searches help with the current session and are not a
          permanent history of everything you searched for.
        </p>
        <h3 className={subheadingClass}>Activity</h3>
        <p>
          Activity brings related account actions into one place. Open an item from Activity to return to its market,
          Callout, comment, or profile. Use it as a way to retrace a recent action when you need more context.
        </p>
        <h3 className={subheadingClass}>Leaderboard</h3>
        <p>
          The Leaderboard is a read-only view of Polymarket’s global all-time volume ranking. Rows represent
          Polymarket traders rather than Knewit profiles, so the page does not provide Knewit follow actions or a
          personal profit-and-loss ranking.
        </p>
      </LegalSection>

      <LegalSection title="12. Available Features">
        <p>
          Knewit features may depend on your account, location, wallet status, and connected service availability.
        </p>
        <DataTable
          headers={['Feature', 'Availability', 'What it does']}
          rows={[
            ['Landing page', 'Available', 'Introduces Knewit, market concepts, product flow, FAQ, and entry points.'],
            ['Sign-in', 'Provider-dependent', 'Use an available email or social sign-in method to create an account.'],
            ['Callouts and social interactions', 'Available', 'Read or publish Callouts, like, comment, reply, and follow other Knewit accounts.'],
            ['Markets and search', 'Available with live data', 'Browse markets, open details, and search for markets or Knewit people.'],
            ['Wallet and portfolio', 'Provider-dependent', 'Review balances and positions, then use deposit, withdrawal, and trade actions where enabled.'],
            ['Activity and profiles', 'Available', 'Review account activity and public profile information.'],
            ['Leaderboard', 'Available; read-only', 'Polymarket global all-time ranking by trading volume; rows are Polymarket traders, not Knewit profiles.'],
            ['Settings and legal pages', 'Available', 'Profile editing, wallet actions, Privacy Policy, Terms, and FAQ link are present.'],
          ]}
        />
        <h3 className={subheadingClass}>Before you act</h3>
        <List>
          <li>Market prices, P/L, and balances can change and depend on data freshness and service availability.</li>
          <li>Only treat an order, deposit, or withdrawal as complete after Knewit and the connected service show a confirmed status.</li>
        </List>
        <h3 className={subheadingClass}>Understanding your account views</h3>
        <p>
          The same action can appear in more than one place. Wallet focuses on balances and positions. Activity
          shows recent actions connected to your account. Your Profile presents the public side of your Knewit
          identity. Use the view that matches the question you are trying to answer, then open a related item for
          its full details.
        </p>
      </LegalSection>

      <LegalSection title="13. Help and Troubleshooting">
        <h3 className={subheadingClass}>A safe way to troubleshoot</h3>
        <List>
          <li>Check the visible status first: pending, confirmed, cancelled, or failed.</li>
          <li>Refresh the relevant Knewit view after a confirmed action, rather than repeating it immediately.</li>
          <li>For a payment or transfer, check the provider’s own status and any transaction reference before trying again.</li>
          <li>If you contact support, include the platform, approximate time, the action you were taking, and any safe error code shown by Knewit.</li>
        </List>
        <h3 className={subheadingClass}>Deposit troubleshooting</h3>
        <DataTable
          headers={['What you may see', 'What it usually means', 'What to do']}
          rows={[
            ['Trading wallet is not ready', 'Wallet setup is still in progress.', 'Wait briefly and retry. If it continues, use the safe error code when contacting support; do not send funds to a different address as a workaround.'],
            ['“Deposit detected” for a while', 'The bridge is processing the transfer.', 'Wait a few minutes. Bitcoin and busy networks can take longer.'],
            ['Bridge couldn’t process it', 'The token, chain, or amount was not supported, or the amount was below the minimum.', 'Contact support with the transaction hash; do not send the same deposit again.'],
            ['A balance has not updated', 'The deposit or its balance update may still be processing.', 'Use Check now, then refresh. Avoid sending a second deposit while the first is pending.'],
            ['A transfer is pending', 'The transfer has been submitted and is processing.', 'Keep the transaction reference, wait for the status to update, and do not submit the same transfer again.'],
          ]}
        />
        <p>
          Support diagnostics should include platform (web/mobile), approximate time, the token and chain
          used, the transaction hash, app version, and the safe error code shown by Knewit. Do not
          send passwords, one-time codes, private keys, recovery phrases, full payment-card details, or
          unredacted identity documents.
        </p>
        <h3 className={subheadingClass}>When a market or Callout is unavailable</h3>
        <p>
          Markets can close, resolve, or stop accepting new orders. A Callout or profile can also become unavailable
          if the related content no longer exists or cannot be loaded. Return to the previous screen, refresh once,
          and search again. If the issue remains, record the title or link of the item before contacting support.
        </p>
      </LegalSection>

      <LegalSection title="14. Glossary and Further Reading">
        <DataTable
          headers={['Term', 'Definition']}
          rows={[
            ['Callout', 'A short community post attached to a position held by its author.'],
            ['Outcome', 'One possible result offered by a prediction market.'],
            ['Implied probability', 'A probability-style interpretation of market price; it is not a guaranteed forecast.'],
            ['Liquidity', 'Availability of trading interest near a displayed price, which can affect execution.'],
            ['Order book', 'Buy and sell interest used to estimate a market order’s execution price.'],
            ['Position', 'An outcome exposure held in a connected trading account.'],
            ['Unrealized P/L', 'Estimated profit or loss on an open position that has not been sold.'],
            ['Trading balance (pUSD)', 'Polymarket USD held in your Polymarket Deposit Wallet  what trades spend and what deposits are credited as.'],
            ['Deposit Wallet', 'Your Polymarket trading wallet. It is controlled by your Knewit (Privy) embedded wallet and holds your trading balance and positions.'],
            ['Bridge', 'Polymarket’s service that converts supported tokens from other chains into pUSD for deposits, and pUSD into your chosen token for withdrawals.'],
            ['Redeem', 'Turning winning shares in a resolved market into trading balance.'],
            ['Transaction hash', 'A public identifier for a submitted blockchain transaction; it does not alone prove successful completion.'],
            ['Market resolution', 'The process that determines the final outcome using the market’s stated rules and source.'],
            ['Pending', 'An action was submitted and is still waiting for a final result.'],
            ['Confirmed', 'Knewit and the connected service report that an action completed.'],
            ['Provider', 'A connected service that may offer sign-in, wallet, bridge, or market functionality.'],
          ]}
        />
      </LegalSection>
    </LegalPage>
  );
}
