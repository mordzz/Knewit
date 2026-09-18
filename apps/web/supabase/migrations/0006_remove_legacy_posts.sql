-- Normal Posts are gone: only Callouts exist, and every Callout attaches
-- a held position (`position_snapshot_market_id` non-null — docs/
-- DECISIONS.md, "Callouts Require a Held Position"). Rows with a null
-- snapshot are legacy normal Posts that can never be created again, so
-- they're removed rather than left rendering as a UI the app no longer
-- has. `comments` and `likes` cascade on the FK to `posts`.
delete from posts where position_snapshot_market_id is null;
