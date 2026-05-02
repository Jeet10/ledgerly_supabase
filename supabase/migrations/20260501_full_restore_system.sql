-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;


-- =========================
-- ADD SOFT DELETE + RESTORE COLUMNS
-- =========================
alter table public.transactions
  add column if not exists deleted_at timestamp with time zone,
  add column if not exists delete_scheduled_for timestamp with time zone,
  add column if not exists last_restored_at timestamp with time zone,
  add column if not exists last_restored_by_email text;


-- =========================
-- INDEXES
-- =========================
create index if not exists transactions_owner_deleted_at_idx
  on public.transactions (owner_id, deleted_at desc);


-- =========================
-- RESTORE EVENTS TABLE
-- =========================
create table if not exists public.transaction_restore_events (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  restored_at timestamp with time zone not null default now(),
  restored_by_email text,
  deleted_at timestamp with time zone,
  original_transaction_date timestamp with time zone,
  note text,
  member_name text,
  amount numeric,
  type text check (type in ('in', 'out'))
);


create index if not exists transaction_restore_events_owner_restored_at_idx
  on public.transaction_restore_events (owner_id, restored_at desc);


-- =========================
-- RLS FOR RESTORE EVENTS
-- =========================
alter table public.transaction_restore_events enable row level security;

drop policy if exists "transaction_restore_events_select_own" on public.transaction_restore_events;
create policy "transaction_restore_events_select_own"
on public.transaction_restore_events for select
using (auth.uid() = owner_id);

drop policy if exists "transaction_restore_events_insert_own" on public.transaction_restore_events;
create policy "transaction_restore_events_insert_own"
on public.transaction_restore_events for insert
with check (auth.uid() = owner_id);


-- =========================
-- FUNCTION: DELETE EXPIRED TRANSACTIONS (30 DAYS)
-- =========================
create or replace function public.purge_expired_deleted_transactions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.transactions
  where deleted_at is not null
    and delete_scheduled_for is not null
    and delete_scheduled_for <= now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function public.purge_expired_deleted_transactions()
is 'Permanently deletes archived transactions after their 30 day restore window.';


-- =========================
-- FUNCTION: DELETE OLD RESTORE LOGS (60 DAYS)
-- =========================
create or replace function public.purge_old_restore_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.transaction_restore_events
  where restored_at <= now() - interval '60 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function public.purge_old_restore_events()
is 'Deletes restore history logs older than 60 days.';


-- =========================
-- CRON JOBS
-- =========================

-- remove old jobs if exist
select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-expired-deleted-transactions';

select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-old-restore-events';


-- schedule: delete transactions (daily 2 AM)
select cron.schedule(
  'purge-expired-deleted-transactions',
  '0 2 * * *',
  $$select public.purge_expired_deleted_transactions();$$
)
where exists (
  select 1 from pg_extension where extname = 'pg_cron'
);


-- schedule: delete restore logs (daily 3 AM)
select cron.schedule(
  'purge-old-restore-events',
  '0 3 * * *',
  $$select public.purge_old_restore_events();$$
)
where exists (
  select 1 from pg_extension where extname = 'pg_cron'
);