-- Trading any Polymarket choice (docs/DECISIONS.md, "Trading Any
-- Polymarket Choice"). Positions/orders/snapshots used to be constrained
-- to literal YES/NO; they now store the chosen outcome's own label (the
-- API's `outcomes` array entry, e.g. "Manchester City") plus its index in
-- that array — the index is what maps to a CLOB token
-- (`clobTokenIds[index]`). `markets` also caches the choice list so feed
-- cards can render every option without a live round-trip.

alter table markets add column if not exists choices jsonb not null default '[]'::jsonb;

alter table positions drop constraint if exists positions_outcome_check;
alter table positions add column if not exists choice_index integer not null default 0;
-- Legacy rows could only be Yes/No markets, and Polymarket lists
-- "Yes" before "No" in that array, so this is an honest best-effort.
update positions set choice_index = 1 where outcome = 'NO';

alter table orders drop constraint if exists orders_outcome_check;
alter table orders add column if not exists choice_index integer not null default 0;
update orders set choice_index = 1 where outcome = 'NO';

alter table posts drop constraint if exists posts_position_snapshot_outcome_check;
alter table posts add column if not exists position_snapshot_choice_index integer;
update posts set position_snapshot_choice_index = case when position_snapshot_outcome = 'NO' then 1 else 0 end
where position_snapshot_outcome is not null;

-- Recreated from 0003 with the choice index added to each variant. The
-- label itself keeps the `outcome` column name/shape the clients already
-- read.
create or replace function user_activity(p_user_id uuid, p_limit int default 21, p_offset int default 0)
returns table (
  id uuid,
  type text,
  created_at timestamptz,
  market_id text,
  market_question text,
  outcome text,
  choice_index integer,
  usd_amount numeric,
  post_id uuid,
  followed_user_id uuid
)
language sql
stable
as $$
  with combined as (
    select
      o.id,
      'TRADE'::text as type,
      o.created_at,
      o.market_id,
      m.question as market_question,
      o.outcome,
      o.choice_index,
      (o.size * o.price / 100.0)::numeric as usd_amount,
      null::uuid as post_id,
      null::uuid as followed_user_id
    from orders o
    left join markets m on m.id = o.market_id
    where o.user_id = p_user_id and o.status = 'filled'

    union all

    select
      p.id,
      'CALL'::text,
      p.created_at,
      p.market_id,
      mk.question,
      p.position_snapshot_outcome,
      coalesce(p.position_snapshot_choice_index, 0),
      null::numeric,
      p.id,
      null::uuid
    from posts p
    left join markets mk on mk.id = p.market_id
    where p.author_id = p_user_id and p.position_snapshot_market_id is not null

    union all

    select
      p.id,
      'POST'::text,
      p.created_at,
      null::text,
      null::text,
      null::text,
      null::integer,
      null::numeric,
      p.id,
      null::uuid
    from posts p
    where p.author_id = p_user_id and p.position_snapshot_market_id is null

    union all

    select
      f.following_id,
      'FOLLOW'::text,
      f.created_at,
      null::text,
      null::text,
      null::text,
      null::integer,
      null::numeric,
      null::uuid,
      f.following_id
    from follows f
    where f.follower_id = p_user_id
  )
  select * from combined
  order by created_at desc
  limit p_limit offset p_offset;
$$;
