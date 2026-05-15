-- 0005_session_target_sets.sql — Snapshot target_sets into session_exercises.
-- planned_exercises already carries target_sets; sessions snapshot planned data,
-- so session_exercises needs its own copy. Existing rows default to 3 (the value
-- the live-session UI previously assumed).

alter table session_exercises
  add column if not exists target_sets int not null default 3 check (target_sets > 0);
