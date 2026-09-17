-- Whether a cached market is a child of an event with more than one
-- market ("market anak"). Feed/detail reads use it to route a post's
-- market attachment to the parent event's detail page instead of the
-- child market's own page (docs/DECISIONS.md, "Attachment of a Child
-- Market Opens Its Parent Event").
alter table markets add column if not exists is_child boolean not null default false;

-- Best-effort backfill for rows cached before this column existed: a
-- market is a child when another cached market shares its event.
update markets m
set is_child = true
where exists (
  select 1
  from markets m2
  where m2.event_id = m.event_id
    and m2.id <> m.id
);
