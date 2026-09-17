'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLoginWithEmail, useLoginWithOAuth } from '@privy-io/react-auth';
import { FcGoogle } from 'react-icons/fc';
import { FaXTwitter } from 'react-icons/fa6';
import { publicEnv } from '@/lib/publicEnv';

/**
 * Direct conversion of `apps/mobile/src/features/auth/screens/SignInScreen.tsx`
 * — same content, same single-column layout, rendered inside the same
 * bordered `max-w-2xl` frame every authenticated page uses
 * (`app/(app)/layout.tsx`) so this looks like the mobile app's screen
 * viewed bigger, not a separate desktop composition: ambient corner
 * glows, a centered logo above, and a bottom panel (rounded top
 * corners only, flush with the frame's own bottom edge — mobile's
 * bottom-sheet-styled `GlassSurface` panel, approximated here without
 * a blur effect DOM has no equivalent for) holding the email/code step,
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
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const goHome = () => router.push('/');

  const { state, sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: goHome,
  });
  const { state: oAuthState, initOAuth } = useLoginWithOAuth({
    onComplete: goHome,
  });

  if (!publicEnv.privyAppId) {
    return (
      <main className="mx-auto flex h-screen w-full max-w-2xl flex-col items-center justify-center gap-2 border-x border-border px-4 text-center">
        <h1 className="text-2xl font-bold">Wallet sign-in isn&apos;t configured yet</h1>
        <p className="text-text-secondary">
          This deployment is missing its Privy app credentials — see docs/WALLET.md.
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
  };

  const handleVerifyCode = async () => {
    await loginWithCode({ code });
  };

  const handleOAuth = async (provider: 'google' | 'twitter') => {
    await initOAuth({ provider });
  };

  return (
    <main className="relative mx-auto flex h-screen w-full max-w-2xl flex-col overflow-hidden border-x border-border">
      {/* Ambient corner glows — same idea as the mobile screen's. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-accent"
        style={{ opacity: 0.08 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent"
        style={{ opacity: 0.06 }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pt-10">
        <Image
          src="/icon.png"
          alt="Knewit"
          width={144}
          height={144}
          className="rounded-[32px] shadow-2xl"
          priority
        />
      </div>

      <div className="relative z-10 w-full rounded-t-3xl border-t border-white/10 bg-surface px-4 pb-8 pt-3">
        <div className="mb-1 h-1 w-9 self-center rounded-full bg-white/20" />

        {!isAwaitingCode ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-3xl font-bold">Sign in</h1>
              <p className="text-sm text-text-secondary">Enter your email to get started</p>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isSendingCode}
              className="min-h-12 rounded-md border border-white/15 bg-white/10 px-3 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode || email.trim().length === 0}
              className="min-h-12 rounded-md border border-white/15 bg-accent px-6 py-3 font-semibold text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSendingCode ? 'Sending…' : 'Continue'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm text-text-secondary">
              Enter the code sent to {email}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              disabled={isSubmittingCode}
              className="min-h-12 rounded-md border border-white/15 bg-white/10 px-3 py-3 text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isSubmittingCode || code.trim().length === 0}
              className="min-h-12 rounded-md border border-white/15 bg-accent px-6 py-3 font-semibold text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmittingCode ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => setCode('')}
              className="min-h-12 rounded-md border border-white/10 bg-transparent px-6 py-3 text-text-secondary transition-opacity hover:opacity-80"
            >
              Use a different email
            </button>
          </div>
        )}

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-tertiary">Or sign in with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={isOAuthLoading || isAwaitingCode}
            className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-6 py-3 font-semibold text-text-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <FcGoogle size={18} />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('twitter')}
            disabled={isOAuthLoading || isAwaitingCode}
            className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-6 py-3 font-semibold text-text-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <FaXTwitter size={16} />
            Continue with X
          </button>
        </div>

        {errorMessage ? (
          <p className="mt-4 text-center text-sm text-danger">{errorMessage}</p>
        ) : null}

        <p className="mt-4 text-center text-xs text-text-tertiary">
          Your wallet is securely managed through Privy. We never see or store your private keys.
        </p>
      </div>
    </main>
  );
}
