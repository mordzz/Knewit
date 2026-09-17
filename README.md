# Knewit

A social prediction-market app — see `docs/PRD.md` for the product overview.

## Structure

```
apps/
  frontend/  Expo/React Native app (mobile)
  backend/   Next.js — API/BFF (Supabase DB, Polymarket proxy, Privy auth
             verification) AND a desktop/tablet web port of the same app
             (src/app/sign-in, etc.), sharing one project/deploy by request
docs/        Architecture, API contract, database model, product docs (not git-tracked)
```

Two independent projects, each with its own `package.json`/`node_modules` — no
shared workspace tooling. Setup: frontend app in `docs/DEVELOPMENT.md`, backend
in [`apps/backend/README.md`](apps/backend/README.md). For how the two talk to
each other and exactly which endpoints currently error and why, see
[`docs/INTEGRATION.md`](docs/INTEGRATION.md).
