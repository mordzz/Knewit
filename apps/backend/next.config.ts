import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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

