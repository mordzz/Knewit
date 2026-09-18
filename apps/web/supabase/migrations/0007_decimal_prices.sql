-- Prices are cents with up to 4 decimal places, not whole cents:
-- Polymarket's tick sizes go as low as 0.001/0.0001 (0.1c/0.01c), so an
-- integer cents column silently rounds a real 0.1c price to 0 — which
-- broke trade estimates (a $1 order at $0.001/share really is 1000
-- shares) and would corrupt entry-price/PnL math for any sub-cent fill.
-- Widening to numeric(10,4) keeps the existing "cents" unit everywhere
-- while preserving the venue's own precision (docs/DECISIONS.md,
-- "Sub-Cent Prices").
alter table markets alter column yes_price type numeric(10, 4);
alter table markets alter column no_price type numeric(10, 4);
alter table orders alter column price type numeric(10, 4);
alter table positions alter column entry_price type numeric(10, 4);
alter table posts alter column position_snapshot_entry_price type numeric(10, 4);
