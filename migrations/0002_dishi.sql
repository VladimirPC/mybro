create table if not exists profiles (
  user_id text primary key,
  display_name text not null default '',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists smoke_state (
  user_id text primary key,
  onboarded boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  last_fact_id text,
  updated_at timestamptz not null default now()
);

create table if not exists smoke_logs (
  id text primary key,
  user_id text not null,
  at timestamptz not null,
  trigger text
);
create index if not exists smoke_logs_user_at_idx on smoke_logs (user_id, at desc);

create table if not exists resisted_logs (
  id text primary key,
  user_id text not null,
  at timestamptz not null
);
create index if not exists resisted_logs_user_at_idx on resisted_logs (user_id, at desc);

create table if not exists companions (
  smoker_id text not null,
  watcher_id text not null,
  created_at timestamptz not null default now(),
  primary key (smoker_id, watcher_id),
  check (smoker_id <> watcher_id)
);
create index if not exists companions_watcher_idx on companions (watcher_id);
