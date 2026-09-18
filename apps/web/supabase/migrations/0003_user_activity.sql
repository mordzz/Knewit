-- Backs `GET /users/:id/activity` (docs/API.md) — a paginated union of
-- four event types this app can actually produce (TRADE, CALL, POST,
-- FOLLOW; see apps/frontend/src/types/activity.ts, "Activity Types
-- Limited to What This App Can Actually Produce"). A SQL UNION ALL
-- with ORDER BY/LIMIT/OFFSET rather than pulling all four tables into
-- the backend and merge-sorting in JS. The function is dropped first:
-- `create or replace` cannot change a return type, so re-running this
-- file over a newer `user_activity` (0004 / 0010) would otherwise fail
-- with `42P13`.
drop function if exists user_activity(uuid, integer, integer);

create function user_activity(p_user_id uuid, p_limit int default 21, p_offset int default 0)
returns table (
  id uuid,
  type text,
  created_at timestamptz,
  market_id text,
  market_question text,
  outcome text,
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
