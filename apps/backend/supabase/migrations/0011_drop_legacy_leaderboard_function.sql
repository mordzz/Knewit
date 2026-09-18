-- Dead DB surface: `leaderboard_ranking` (0002) was the local
-- orders-aggregate ranking from before the leaderboard moved to
-- Polymarket's own live ranking (docs/DECISIONS.md, "Leaderboard Sourced
-- Live from Polymarket's Data API"). No code calls it any more — drop it
-- rather than leave an unused function behind.
drop function if exists leaderboard_ranking(uuid);
