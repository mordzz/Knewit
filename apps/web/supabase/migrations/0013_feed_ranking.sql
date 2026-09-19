-- Trending callouts: engagement weighted by a recency decay over seven days.
create or replace function trending_posts(p_limit int default 21, p_offset int default 0)
returns setof posts
language sql
stable
as $$
  select p.*
  from posts p
  where p.created_at >= now() - interval '7 days'
  order by
    ((p.like_count + (p.comment_count * 3))::numeric /
      power(extract(epoch from (now() - p.created_at)) / 3600 + 2, 1.2)) desc,
    p.created_at desc,
    p.id desc
  limit p_limit offset p_offset;
$$;

create index if not exists posts_created_at_author_idx on posts (created_at desc, author_id);
create index if not exists follows_follower_following_idx on follows (follower_id, following_id);
