-- 0004_bodyweight.sql — Mark planned exercises as bodyweight-based.
-- When `is_bodyweight = true`, weight_kg represents EXTRA weight on top of body
-- weight (e.g. dip belt). Default 0 means pure bodyweight.

alter table planned_exercises
  add column if not exists is_bodyweight boolean not null default false;

alter table session_exercises
  add column if not exists is_bodyweight boolean not null default false;
