-- Server-only journal used to serialize and reconcile money-moving actions.
create table if not exists wallet_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  operation_type text not null check (operation_type in ('deposit_swap', 'deposit_wrap', 'withdraw', 'buy', 'sell')),
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'confirmed', 'failed', 'reconciliation_required')),
  provider_action_id text,
  provider_wallet_id text,
  provider_order_id text,
  transaction_id text,
  transaction_hash text,
  request jsonb not null default '{}'::jsonb,
  result jsonb,
  error_code text,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reconciled_at timestamptz
);

create index if not exists wallet_operations_pending_idx
  on wallet_operations (updated_at, operation_type)
  where status in ('pending', 'submitted', 'reconciliation_required');

create unique index if not exists wallet_operations_idempotency_uidx
  on wallet_operations (user_id, operation_type, idempotency_key);

create unique index if not exists wallet_operations_one_active_per_type_idx
  on wallet_operations (user_id, operation_type)
  where status in ('pending', 'submitted', 'reconciliation_required');

alter table wallet_operations enable row level security;
revoke all on table wallet_operations from public, anon, authenticated;
grant all on table wallet_operations to service_role;

-- Link venue rows to the durable operation so retry/reconciliation can be idempotent.
alter table orders add column if not exists wallet_operation_id uuid references wallet_operations(id);
create unique index if not exists orders_wallet_operation_id_uidx
  on orders (wallet_operation_id)
  where wallet_operation_id is not null;

alter table positions add column if not exists wallet_operation_id uuid references wallet_operations(id);
create unique index if not exists positions_wallet_operation_id_uidx
  on positions (wallet_operation_id)
  where wallet_operation_id is not null;
