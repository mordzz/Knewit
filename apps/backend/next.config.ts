import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Build-time required env vars. `providers.tsx` mounts `<PrivyProvider>`
 * on every prerendered page, and Privy throws on an empty app id — so a
 * Vercel deploy without `NEXT_PUBLIC_PRIVY_APP_ID` used to fail deep
 * inside page-data collection with a confusing Privy error, leaving the
 * domain on Vercel's 404 (no successful production deployment). Fail
 * upfront with the actual fix instead. Server secrets are runtime-only
 * and deliberately not required here.
 */
const REQUIRED_BUILD_ENV = ['NEXT_PUBLIC_PRIVY_APP_ID'] as const;
const missingBuildEnv = REQUIRED_BUILD_ENV.filter((key) => !process.env[key]);

if (missingBuildEnv.length > 0) {
  const message =
    `Missing build-time environment variable(s): ${missingBuildEnv.join(', ')}. ` +
    'Set them in Vercel -> Settings -> Environment Variables (Production and Preview), ' +
    'then redeploy — see README, "Deploying to Vercel", for the full list.';
  // Vercel (`VERCEL=1`) must fail loudly; local/CI builds only warn so a
  // plain `next build` still works from a clone without secrets.
  if (process.env.VERCEL) {
    throw new Error(message);
  }
  console.warn(`[next.config] ${message}`);
}

const nextConfig: NextConfig = {
  // No framework fingerprint in responses.
  poweredByHeader: false,
  // Baseline hardening for every route: no MIME sniffing, no framing,
  // minimal referrer leakage, and no browser features this app doesn't
  // use. (A full Content-Security-Policy is deliberately not set here —
  // Privy's hosted flows and Supabase storage would each need an
  // allowlist, and a wrong CSP breaks sign-in; see docs/DECISIONS.md,
  // "Security Headers and Error Sanitization".)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  // This repo is a monorepo with a lockfile at both the repo root and
  // this app's own directory (apps/backend, apps/frontend each have
  // their own independent package.json/lockfile — see docs/ARCHITECTURE.md,
  // "no shared workspace tooling"). Without this, Turbopack guesses the
  // workspace root from whichever lockfile it finds first, which is the
  // wrong one here.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

