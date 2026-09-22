'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth';
import { FcGoogle } from 'react-icons/fc';
import { FaXTwitter } from 'react-icons/fa6';
import { CodeInput } from '@/components/ui/CodeInput';
import { SOLID_PANEL_CLASS } from '@/components/ui/solidPanel';
import { SignInShowcase } from '@/features/auth/components/SignInShowcase';
import { publicEnv } from '@/lib/publicEnv';
import { useGuestStore } from '@/lib/guest/guestStore';

/**
 * Direct conversion of `apps/mobile/src/features/auth/screens/SignInScreen.tsx`
 * below `lg:` — same content, same single-column layout, rendered
 * inside the same bordered `max-w-2xl` frame every authenticated page
 * uses (`app/(app)/layout.tsx`) so this looks like the mobile app's
 * screen viewed bigger, not a separate desktop composition: ambient
 * corner glows, a centered logo above, and a bottom panel (rounded top
 * corners only, flush with the frame's own bottom edge — the same
 * solid-black + glass-edge treatment as mobile's sign-in panel and the
 * `Modal`/`BottomSheet` surfaces: `bg-background` + faint white border
 * with a brighter top edge) holding the email/code step,
 * "Or sign in with" divider, Google/X buttons, error line, and security
 * footnote — same order, same copy.
 *
 * **The web SDK's login hooks differ from `@privy-io/expo`'s in one
 * important way**: `useLoginWithOAuth` here returns `initOAuth`, a full
 * page redirect (`window.location.assign` to the provider, then back to
 * this same page) — it does not resolve with the logged-in user like
 * the Expo hook's in-app-browser-session `login()` does. Both this and
 * `useLoginWithEmail`'s `loginWithCode` are therefore driven by one
 * shared `onComplete` callback (registered on both hooks) rather than
 * awaiting a return value — verified against the installed
 * `@privy-io/react-auth` type declarations while building this, not
 * assumed from the mobile SDK's shape. `onComplete` also only fires once
 * embedded-wallet creation (configured in `app/providers.tsx`,
 * `createOnLogin: 'users-without-wallets'`) has finished, so there's no
 * separate "create wallet if missing" step to write here — Privy's own
 * config already does it, unlike the mobile screen which creates the
 * wallet manually after login.
 *
 * **Google/X sign-in requires those providers to be enabled as login
 * methods in the Privy Dashboard** — dashboard configuration, not code;
 * without it, `initOAuth` redirects to a Privy error page instead of a
 * fabricated success.
 */
export default function SignInPage() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const enterGuest = useGuestStore((state) => state.enterGuest);
  const isGuest = useGuestStore((state) => state.isGuest);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  // `router.replace` is a soft, client-side navigation — Next.js can fetch
  // the destination's RSC payload successfully yet never actually commit
  // the URL/route swap (observed directly: the /callouts request lands
  // with a 200, the address bar still reads /sign-in). When that happens
  // there's no rejected promise or thrown error to catch, so the user is
  // left stuck on this screen indefinitely. Verify the navigation actually
  // took within a couple seconds and force a full page load if it didn't —
  // slower, but guaranteed to land.
  const goToApp = () => {
    router.replace('/callouts');
    window.setTimeout(() => {
      if (window.location.pathname === '/sign-in') window.location.assign('/callouts');
    }, 2000);
  };

  // Guest mode is a session too — leave this screen as soon as it starts,
  // the same way a completed Privy login does.
  useEffect(() => {
    if (isGuest) goToApp();
  }, [isGuest]);

  // AppLayout can bounce back here if it mounts before Privy's
  // `authenticated` flag has propagated to this component (a race right
  // after login). Once it does propagate, retry the navigation instead of
  // leaving the user stuck until a manual refresh.
  useEffect(() => {
    if (authenticated) goToApp();
  }, [authenticated]);

  // The authenticated app shell owns the wallet setup gate. Route there as
  // soon as login completes so it can reconcile Privy's wallet state and
  // continue setup without relying on this screen's potentially stale user
  // snapshot to update.
  const beginSetup = () => {
    setIsPreparing(true);
    goToApp();
  };

  const { state, sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: beginSetup,
  });
  const { state: oAuthState, initOAuth } = useLoginWithOAuth({
    onComplete: beginSetup,
  });

  if (!publicEnv.privyAppId) {
    return (
      <main className="mx-auto flex h-screen w-full max-w-2xl flex-col items-center justify-center gap-2 border-x border-border px-4 text-center">
        <h1 className="text-2xl font-bold">Wallet sign-in isn&apos;t configured yet</h1>
        <p className="text-text-secondary">
          This deployment is missing its wallet credentials — see docs/WALLET.md.
        </p>
        <button
          type="button"
          onClick={enterGuest}
          className="mt-4 min-h-12 rounded-md lg:rounded-xl border border-white/15 bg-white/10 px-8 py-3 font-semibold text-text-primary transition-opacity hover:opacity-90"
        >
          Sign in as guest
        </button>
        <p className="text-xs text-text-tertiary">
          Guest mode runs a local demo — no wallet, database, or sign-in needed.
        </p>
      </main>
    );
  }

  const isSendingCode = state.status === 'sending-code';
  const isAwaitingCode = state.status === 'awaiting-code-input' || state.status === 'submitting-code';
  const isSubmittingCode = state.status === 'submitting-code';
  const isOAuthLoading = oAuthState.status === 'loading';
  const errorMessage =
    state.status === 'error'
      ? state.error?.message ?? 'Something went wrong. Try again.'
      : oAuthState.status === 'error'
        ? oAuthState.error?.message ?? 'Something went wrong. Try again.'
        : null;

  const handleSendCode = async () => {
    await sendCode({ email });
    setResendSeconds(60);
  };

  const handleResendCode = async () => {
    setResendSeconds(60);
    await sendCode({ email });
  };

  const handleChangeEmail = () => {
    setCode('');
    setEmail('');
  };

  const handleVerifyCode = async () => {
    await loginWithCode({ code });
  };

  const handleOAuth = async (provider: 'google' | 'twitter') => {
    await initOAuth({ provider });
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col overflow-y-auto border-x border-border bg-background lg:h-screen lg:grid lg:max-w-none lg:grid-cols-[1.1fr_.9fr] lg:overflow-visible lg:border-x-0 lg:bg-transparent">
      <SignInShowcase />
      <section className="relative flex min-h-screen flex-1 flex-col overflow-hidden lg:min-h-0 lg:justify-center lg:overflow-y-auto lg:bg-[radial-gradient(60%_45%_at_50%_0%,rgba(255,229,6,0.07),transparent)] lg:px-10">
        {/* Ambient corner glows — same idea as the mobile screen's. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-accent lg:hidden"
          style={{ opacity: 0.08 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent lg:hidden"
          style={{ opacity: 0.06 }}
        />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-10 lg:hidden">
          <Link
            href="/"
            aria-label="Back to home"
            className="group rounded-[28px] focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-4"
          >
            <Image
              src="/icon.png"
              alt="Knew it"
              width={112}
              height={112}
              className="rounded-[28px] shadow-[0_18px_45px_rgba(255,229,6,0.18)] transition-transform duration-200 group-active:scale-95"
              priority
            />
          </Link>
          <p className="mt-4 text-sm font-semibold tracking-[0.18em] text-text-secondary uppercase">Knew it</p>
        </div>

        <div
          className={`relative z-10 w-full rounded-t-3xl ${SOLID_PANEL_CLASS} border-b-0 px-5 pb-6 pt-5 shadow-xl lg:mx-auto lg:mb-0 lg:w-full lg:max-w-[400px] lg:rounded-none lg:border-transparent lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none`}
        >

        {isPreparing ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <h1 className="text-2xl font-bold">Setting up your account…</h1>
            <p className="text-sm text-text-secondary">
              Creating your wallet and enabling trading. This only happens once.
            </p>
          </div>
        ) : (
          <>
            {!isAwaitingCode ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:gap-1 lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl lg:tracking-normal">Welcome back</h1>
              <p className="text-sm text-text-secondary">Sign in to continue to Knew it</p>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isSendingCode}
              className="min-h-[52px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/70 lg:min-h-12 lg:bg-white/10 lg:px-3 lg:py-3 lg:focus:ring-1 lg:focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode || email.trim().length === 0}
              className="min-h-[52px] rounded-xl border border-accent bg-accent px-6 py-3 font-semibold text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-50 lg:min-h-12"
            >
              {isSendingCode ? 'Sending…' : 'Continue'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:gap-1 lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl lg:tracking-normal">Check your email</h1>
              <p className="text-sm text-text-secondary">We sent a 6-digit code to {email}</p>
            </div>

            <CodeInput value={code} onChange={setCode} disabled={isSubmittingCode} />

            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isSubmittingCode || code.length !== 6}
              className="min-h-[52px] rounded-xl border border-accent bg-accent px-6 py-3 font-semibold text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-50 lg:min-h-12"
            >
              {isSubmittingCode ? 'Verifying…' : 'Verify'}
            </button>

            <div className="flex items-center justify-center gap-4">
              {resendSeconds > 0 ? (
                <span className="text-xs text-text-tertiary">Resend in {resendSeconds}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  className="text-xs font-semibold text-text-secondary transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-xs font-semibold text-text-secondary transition-opacity hover:opacity-80"
              >
                Change email
              </button>
            </div>
          </div>
        )}

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-tertiary">Or sign in with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={isOAuthLoading || isAwaitingCode}
            className="lg:px-3 lg:text-sm flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-text-primary transition-opacity hover:opacity-90 disabled:opacity-50 lg:min-h-12 lg:bg-white/10"
          >
            <FcGoogle size={18} />
            <span className="lg:hidden">Continue with </span>Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('twitter')}
            disabled={isOAuthLoading || isAwaitingCode}
            className="lg:px-3 lg:text-sm flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-text-primary transition-opacity hover:opacity-90 disabled:opacity-50 lg:min-h-12 lg:bg-white/10"
          >
            <FaXTwitter size={16} />
            <span className="lg:hidden">Continue with </span>X
          </button>
          <button
            type="button"
            onClick={enterGuest}
            disabled={isOAuthLoading}
            className="lg:col-span-2 lg:border-transparent lg:bg-transparent lg:text-text-secondary lg:hover:underline flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-6 py-3 font-semibold text-text-secondary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Sign in as guest
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-text-tertiary lg:text-left">
          Guest mode runs a local demo — trades and posts are simulated and nothing is saved to a
          real account.
        </p>

        {errorMessage ? (
          <p className="mt-4 text-center text-sm text-danger">{errorMessage}</p>
        ) : null}
          </>
        )}

        <p className="mt-4 text-center text-xs text-text-tertiary lg:text-left">
          Your wallet is securely managed for you. We never see or store your private keys.
        </p>
        </div>
      </section>
    </main>
  );
}
