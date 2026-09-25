import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy · Knewit' };

const List = ({ children }: { children: React.ReactNode }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>;
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="mt-5 font-semibold text-landing-ink">{children}</h3>;

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" effectiveDate="September 25, 2026">
    <p>This Privacy Policy explains how Knewit (“Knewit,” “we,” “us,” or “our”) collects, uses, stores, and shares information when you access or use the Knewit mobile application, website, and related services (collectively, the “Services”).</p>
    <p>Knewit is a social prediction market application. It uses Privy for sign-in and embedded wallets, and Polymarket for prediction markets, trading, portfolio data, and deposits and withdrawals through Polymarket’s bridge. By accessing or using Knewit, you acknowledge that you have read and understood this Privacy Policy.</p>

    <LegalSection title="1. Information We Collect">
      <p>The information we collect depends on how you use Knewit.</p>
      <H3>Information you provide</H3>
      <List>
        <li>Display name, username, bio, profile picture, and cover image</li>
        <li>Callouts, comments, replies, likes, and follows</li>
        <li>Withdrawal details you enter: the destination address, chain, token, and amount</li>
        <li>Information you send when contacting support</li>
      </List>
      <H3>Sign-in information</H3>
      <p>Knewit uses Privy for sign-in with email, Google, X, or other supported methods. Depending on the method, we receive your Privy user identifier and may receive your email address, name, or social account identifier. Your use of Privy is also subject to Privy’s own terms and privacy policy.</p>
      <H3>Wallet information</H3>
      <p>When you sign in, Privy creates an embedded wallet for you, and Polymarket creates a Deposit Wallet (your trading wallet) controlled by it. We store and process the public addresses of these wallets and of your Polymarket bridge deposit addresses. We do not receive or store your private keys or recovery phrases.</p>
      <p>To place trades, deposits, and withdrawals you request, you authorize Knewit’s server as a signer on your embedded wallet through Privy. Knewit uses that authorization only to carry out actions you start in the app.</p>
      <H3>Trading and transfer records</H3>
      <p>We keep a record of the money-moving actions you request — buys, sells, withdrawals, and card-deposit transfers — including the market, outcome, amount, price, status, destination address and chain for withdrawals, and transaction identifiers. This record prevents duplicate transactions and lets us reconcile their outcome. Your balance, positions, and profit and loss are read live from Polymarket and are not stored by Knewit.</p>
    </LegalSection>

    <LegalSection title="2. Automatically Collected Information">
      <p>Our hosting and infrastructure providers may automatically process IP address, device and browser type, operating system, app version, language, request logs, error and crash information, and date and time of access. We use this information for security, fraud prevention, troubleshooting, and improving the Services.</p>
    </LegalSection>

    <LegalSection title="3. Public Information and Social Features">
      <p>Your profile (display name, username, bio, profile and cover images), Callouts with their attached market, outcome, entry price and size, comments, replies, likes, follows, and activity are visible to other users. Wallet addresses and blockchain transactions are public by nature. Avoid publishing confidential or sensitive personal information.</p>
    </LegalSection>

    <LegalSection title="4. How We Use Your Information">
      <List>
        <li>Create and manage your account and profile</li>
        <li>Authenticate you and keep your session secure</li>
        <li>Create and operate your wallets and carry out trades, deposits, withdrawals, and redemptions you request</li>
        <li>Show markets, prices, your balance, positions, and profit and loss</li>
        <li>Provide Callouts, comments, follows, feeds, search, and the leaderboard</li>
        <li>Prevent duplicate or fraudulent transactions and reconcile transaction outcomes</li>
        <li>Detect abuse, maintain security, and diagnose problems</li>
        <li>Provide support and communicate service or policy updates</li>
        <li>Comply with legal obligations</li>
      </List>
    </LegalSection>

    <LegalSection title="5. Service Providers We Use">
      <p>We share information with the providers below only as needed to operate the Services. Each processes information under its own terms and privacy policy.</p>
      <List>
        <li><strong>Privy</strong> — sign-in, embedded wallets, and transaction signing.</li>
        <li><strong>Polymarket</strong> — market data, order placement, portfolio data, gasless wallet transactions, and the bridge used for deposits and withdrawals. Polymarket’s bridge relies on its own bridge provider to move funds between chains. Your Deposit Wallet address, bridge addresses, withdrawal destination, and order details are sent to Polymarket to carry out your requests. Orders placed through Knewit include Knewit’s Polymarket builder code, which attributes the order to Knewit.</li>
        <li><strong>Supabase</strong> — our database and storage for profile and cover images.</li>
        <li><strong>Vercel</strong> — hosting of the Knewit website and API.</li>
        <li><strong>Polygon network nodes</strong> — reading public transaction receipts and balances.</li>
        <li><strong>MoonPay or other card providers</strong> — only if card deposits are offered in your app. The provider collects payment and identity information directly under its own policies; Knewit does not receive your full card details.</li>
      </List>
      <p>We may also disclose information when required by law or legal process, or when reasonably necessary to protect Knewit, users, or others from fraud, abuse, or security threats.</p>
    </LegalSection>

    <LegalSection title="6. Blockchain Information">
      <p>Deposits, trades, redemptions, and withdrawals create records on public blockchains, including wallet addresses, amounts, and timestamps. These records are permanent and public. Knewit cannot delete or change them.</p>
    </LegalSection>

    <LegalSection title="7. Data Security">
      <p>We use reasonable technical and organizational measures to protect information, including restricting database access to our server and keeping signing credentials server-side. No system can be guaranteed completely secure. Never share your password, one-time codes, private key, or recovery phrase with anyone, including Knewit support.</p>
    </LegalSection>

    <LegalSection title="8. Data Retention">
      <p>We keep account and profile information while your account is active. Trading and transfer records are kept as long as reasonably necessary for reconciliation, security, fraud prevention, dispute resolution, and legal requirements. Public blockchain records remain permanently available.</p>
    </LegalSection>

    <LegalSection title="9. Account Deletion">
      <p>You can request deletion of your Knewit account from the app or by contacting support. We delete your profile and content, except information we must keep for legal, security, fraud-prevention, or compliance reasons. Deleting a Knewit account does not delete public blockchain records, funds or positions held in your wallets, or information held by Privy, Polymarket, or other providers under their own policies. Withdraw any balance before deleting your account.</p>
    </LegalSection>

    <LegalSection title="10. Children’s Privacy">
      <p>Knewit is not intended for children. You must meet the minimum age required by law and by the providers we use. Prediction-market functionality may have additional age, geographic, and eligibility restrictions.</p>
    </LegalSection>

    <LegalSection title="11. International Processing">
      <p>Knewit and its providers may process information in countries other than where you live. Where required, appropriate safeguards are used for international transfers.</p>
    </LegalSection>

    <LegalSection title="12. Your Choices and Rights">
      <p>You can edit or remove your profile details and images, delete your Callouts and comments, unfollow accounts, or use guest mode, which uses simulated data and creates no real trading record. Depending on where you live, you may have the right to access, correct, delete, restrict, or object to the processing of your personal information, or to receive a copy of it. We may need to verify that a request relates to you before acting on it.</p>
    </LegalSection>

    <LegalSection title="13. Changes to This Policy">
      <p>We may update this Policy when Knewit’s features, providers, or legal requirements change. For material changes, we will provide notice through the app, website, or another appropriate method. The date at the top shows when this Policy was last updated.</p>
    </LegalSection>

    <LegalSection title="14. Contact Us">
      <p>For questions or requests about this Policy or your information, contact Knewit through the support contact in the app or on the Knewit website. Include the feature you were using and how to reach you. Never send a password, one-time code, private key, recovery phrase, complete card number, or unredacted identity document.</p>
    </LegalSection>
  </LegalPage>;
}
