-- 0003_rest_seconds.sql — Add rest_seconds to planned_exercises and session_exercises
-- (snapshotted into sessions to match the rest of the snapshot pattern).

alter table planned_exercises
  add column if not exists rest_seconds int check (rest_seconds is null or rest_seconds between 0 and 600);

alter table session_exercises
  add column if not exists rest_seconds int check (rest_seconds is null or rest_seconds between 0 and 600);
