-- 0001_init.sql — Gym Tracker initial schema
-- All tables: uuid PK, sync columns (updated_at, deleted_at), user-scoped RLS.
-- Catalog rows in `exercises` with user_id IS NULL are global (readable by anyone).

create extension if not exists "uuid-ossp";

-- Helper: bump updated_at on every UPDATE
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,  -- NULL = global catalog
  name text not null,
  muscle_group text not null check (muscle_group in
    ('chest','back','legs','shoulders','arms','core','other')),
  category text not null check (category in
    ('compound_heavy','compound_light','isolation')),
  default_increment_kg numeric(4,2) not null default 2.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index exercises_user_id_idx on exercises (user_id);
create index exercises_updated_at_idx on exercises (updated_at);
create trigger exercises_set_updated_at before update on exercises
  for each row execute function set_updated_at();

alter table exercises enable row level security;
create policy "read catalog and own exercises" on exercises for select
  using (user_id is null or user_id = auth.uid());
create policy "insert own exercises" on exercises for insert
  with check (user_id = auth.uid());
create policy "update own exercises" on exercises for update
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- routines
-- ---------------------------------------------------------------------------
create table routines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  is_archived boolean not null default false,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index routines_user_id_idx on routines (user_id);
create unique index routines_one_active_per_user
  on routines (user_id) where is_active = true and deleted_at is null;
create trigger routines_set_updated_at before update on routines
  for each row execute function set_updated_at();

alter table routines enable row level security;
create policy "own routines" on routines for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- training_days
-- ---------------------------------------------------------------------------
create table training_days (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid not null references routines(id) on delete cascade,
  name text not null,
  position int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index training_days_routine_id_idx on training_days (routine_id);
create trigger training_days_set_updated_at before update on training_days
  for each row execute function set_updated_at();

alter table training_days enable row level security;
create policy "training_days follow routine" on training_days for all
  using (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- planned_exercises
-- ---------------------------------------------------------------------------
create table planned_exercises (
  id uuid primary key default uuid_generate_v4(),
  training_day_id uuid not null references training_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  position int not null,
  target_sets int not null check (target_sets > 0),
  target_reps_min int not null check (target_reps_min > 0),
  target_reps_max int not null check (target_reps_max >= target_reps_min),
  target_weight_kg numeric(6,2) not null default 0 check (target_weight_kg >= 0),
  target_rir int check (target_rir is null or target_rir between 0 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index planned_exercises_day_idx on planned_exercises (training_day_id);
create trigger planned_exercises_set_updated_at before update on planned_exercises
  for each row execute function set_updated_at();

alter table planned_exercises enable row level security;
create policy "planned_exercises follow day" on planned_exercises for all
  using (exists (
    select 1 from training_days d
    join routines r on r.id = d.routine_id
    where d.id = training_day_id and r.user_id = auth.uid()))
  with check (exists (
    select 1 from training_days d
    join routines r on r.id = d.routine_id
    where d.id = training_day_id and r.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- sessions (immutable snapshot)
-- ---------------------------------------------------------------------------
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid references routines(id) on delete set null,
  training_day_id uuid references training_days(id) on delete set null,
  training_day_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sessions_user_started_idx on sessions (user_id, started_at desc);
create trigger sessions_set_updated_at before update on sessions
  for each row execute function set_updated_at();

alter table sessions enable row level security;
create policy "own sessions" on sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- session_exercises (snapshot)
-- ---------------------------------------------------------------------------
create table session_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  exercise_name text not null,
  position int not null,
  target_reps_min int not null,
  target_reps_max int not null,
  target_weight_kg numeric(6,2) not null,
  target_rir int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index session_exercises_session_idx on session_exercises (session_id);
create index session_exercises_exercise_idx on session_exercises (exercise_id);
create trigger session_exercises_set_updated_at before update on session_exercises
  for each row execute function set_updated_at();

alter table session_exercises enable row level security;
create policy "session_exercises follow session" on session_exercises for all
  using (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- session_sets
-- ---------------------------------------------------------------------------
create table session_sets (
  id uuid primary key default uuid_generate_v4(),
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  set_number int not null check (set_number > 0),
  weight_kg numeric(6,2) not null check (weight_kg >= 0),
  reps int not null check (reps >= 0),
  rir int check (rir is null or rir between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index session_sets_se_idx on session_sets (session_exercise_id);
create trigger session_sets_set_updated_at before update on session_sets
  for each row execute function set_updated_at();

alter table session_sets enable row level security;
create policy "session_sets follow session" on session_sets for all
  using (exists (
    select 1 from session_exercises se
    join sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()))
  with check (exists (
    select 1 from session_exercises se
    join sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()));
