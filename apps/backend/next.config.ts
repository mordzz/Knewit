import path from 'node:path';
import type { NextConfig } from 'next';

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

