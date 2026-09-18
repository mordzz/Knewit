-- Full schema per docs/DATABASE.md. Written once, upfront, since the
-- entity model there is already complete — later phases (social,
-- trading) add API endpoints against these tables, not new migrations
-- for the core shape. Only `events`/`markets` are populated by the
-- Foundation phase (Phase 1); the rest exist now so Phase 2/3 don't
-- need a schema migration of their own.

create extension if not exists pgcrypto;

-- Event/Market: a cache of Polymarket data, not authored by our users
-- (docs/DATABASE.md). Primary keys are Polymarket's own string ids, not
-- generated uuids, since we're caching their records under their ids.
create table if not exists events (
  id text primary key,
  title text not null,
  category text not null,
  updated_at timestamptz not null default now()
);

create table if not exists markets (
  id text primary key,
  event_id text not null references events (id) on delete cascade,
  question text not null,
  yes_price integer not null, -- cents, 1-99
  no_price integer not null, -- cents, 1-99
  volume numeric not null default 0,
  liquidity numeric not null default 0,
  end_date timestamptz,
  resolved boolean not null default false,
  resolved_outcome text check (resolved_outcome in ('YES', 'NO')),
  updated_at timestamptz not null default now()
);

create index if not exists markets_event_id_idx on markets (event_id);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null unique,
  handle text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  wallet_address text,
  created_at timestamptz not null default now()
);

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  market_id text not null references markets (id) on delete cascade,
  outcome text not null check (outcome in ('YES', 'NO')),
  entry_price integer not null, -- cents
  size numeric not null, -- shares
  opened_at timestamptz not null default now()
);

create index if not exists positions_user_id_idx on positions (user_id);
create index if not exists positions_market_id_idx on positions (market_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  market_id text not null references markets (id) on delete cascade,
  outcome text not null check (outcome in ('YES', 'NO')),
  size numeric not null,
  price integer not null, -- cents
  status text not null check (status in ('pending', 'filled', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_market_id_status_idx on orders (market_id, status);

-- A "Call" is a Post whose position_snapshot_* fields are non-null —
-- no separate Call table (docs/SOCIAL-FEATURE.md, docs/DATABASE.md).
-- The snapshot is embedded and immutable: no UPDATE path should ever
-- touch these columns after insert.
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users (id) on delete cascade,
  body text not null,
  market_id text references markets (id) on delete set null,
  position_snapshot_market_id text,
  position_snapshot_outcome text check (position_snapshot_outcome in ('YES', 'NO')),
  position_snapshot_entry_price integer, -- cents
  position_snapshot_size numeric, -- shares
  position_snapshot_captured_at timestamptz,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_id_idx on posts (author_id);
create index if not exists posts_market_id_idx on posts (market_id);
create index if not exists posts_created_at_idx on posts (created_at desc);

-- One level deep in MVP: parent_comment_id always points at a
-- top-level comment, never another reply (docs/DATABASE.md, "One
-- Reply Level").
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references users (id) on delete cascade,
  parent_comment_id uuid references comments (id) on delete cascade,
  body text not null,
  like_count integer not null default 0,
  share_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on comments (post_id);
create index if not exists comments_parent_comment_id_idx on comments (parent_comment_id);

create table if not exists likes (
  user_id uuid not null references users (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists comment_likes (
  user_id uuid not null references users (id) on delete cascade,
  comment_id uuid not null references comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create table if not exists follows (
  follower_id uuid not null references users (id) on delete cascade,
  following_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on follows (following_id);
