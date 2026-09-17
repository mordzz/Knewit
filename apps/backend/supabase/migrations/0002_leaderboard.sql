-- Leaderboard ranking (docs/DATABASE.md: "SUM(Order.size * Order.price)
-- per userId for status = 'filled' orders, ranked descending, tie-break
-- by createdAt ASC on the user's earliest filled order") — volume only,
-- never PnL, see docs/DECISIONS.md. A SQL function rather than pulling
-- every order row into the backend and aggregating in JS, since ranking
-- is exactly what the database is good at.
--
-- Returns the *full* ranking, unpaginated — the backend
-- (app/api/leaderboard/route.ts) pages and looks up the viewer's own
-- rank from this single result set, which is fine at this project's
-- current scale (bounded by distinct traders, not total orders).
create or replace function leaderboard_ranking(p_follower_id uuid default null)
returns table (
  user_id uuid,
  volume numeric,
  rank bigint
)
language sql
stable
as $$
  select
    o.user_id,
    sum(o.size * o.price / 100.0) as volume,
    rank() over (order by sum(o.size * o.price / 100.0) desc, min(o.created_at) asc) as rank
  from orders o
  where o.status = 'filled'
    and (
      p_follower_id is null
      or o.user_id in (select following_id from follows where follower_id = p_follower_id)
    )
  group by o.user_id
  order by rank asc;
$$;
