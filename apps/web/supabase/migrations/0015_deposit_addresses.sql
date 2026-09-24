-- Maps every on-chain address a user can deposit to back to its owner:
-- the embedded wallet (native USDC) and the Polymarket Deposit Wallet
-- (USDC.e). The Alchemy address-activity webhook only receives an address
-- and an amount, so this is how it knows whose deposit to convert.
create table if not exists deposit_addresses (
  address text primary key check (address = lower(address)),
  user_id uuid not null references users (id) on delete cascade,
  privy_user_id text not null,
  kind text not null check (kind in ('embedded', 'deposit_wallet')),
  -- When the address was added to the Alchemy webhook (null = not yet,
  -- or Alchemy isn't configured).
  webhook_registered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists deposit_addresses_user_idx on deposit_addresses (user_id);

alter table deposit_addresses enable row level security;
revoke all on table deposit_addresses from public, anon, authenticated;
grant all on table deposit_addresses to service_role;
