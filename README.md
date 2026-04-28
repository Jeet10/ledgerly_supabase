# Ledgerly (Supabase Version)

A simple cash ledger app built with Next.js and Supabase.

This version supports:
- Organization-level login with Supabase Auth
- Per-user data isolation so each organization only sees its own data
- Members inside each organization as reusable names for transaction ownership
- Cash in/out tracking with notes, dates, and filtering

## 1. Create a Supabase project

- Go to https://supabase.com
- Create a project
- Copy the Project URL and `anon` public API key

## 2. Enable email/password auth

In Supabase:
- Open `Authentication -> Providers`
- Enable `Email`
- Turn on `Email + Password`

If you do not want email confirmation during local testing:
- Open `Authentication -> Providers -> Email`
- Disable `Confirm email`

## 3. Create the tables

Run this SQL in the Supabase SQL editor:

```sql
create extension if not exists "uuid-ossp";

create table if not exists members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now(),
  primary key (owner_id, name)
);

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_name text not null,
  amount numeric not null,
  type text not null check (type in ('in', 'out')),
  note text,
  transaction_date timestamp with time zone not null default now(),
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone,
  delete_scheduled_for timestamp with time zone
);
```

## 4. Turn on row level security

Run this SQL too:

```sql
alter table members enable row level security;
alter table transactions enable row level security;

create policy "members_select_own"
on members for select
using (auth.uid() = owner_id);

create policy "members_insert_own"
on members for insert
with check (auth.uid() = owner_id);

create policy "members_update_own"
on members for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "members_delete_own"
on members for delete
using (auth.uid() = owner_id);

create policy "transactions_select_own"
on transactions for select
using (auth.uid() = owner_id);

create policy "transactions_insert_own"
on transactions for insert
with check (auth.uid() = owner_id);

create policy "transactions_update_own"
on transactions for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "transactions_delete_own"
on transactions for delete
using (auth.uid() = owner_id);
```

## 5. If you already created the earlier schema

If your `transactions` table currently has `member_id`, switch it to plain text:

```sql
alter table transactions add column if not exists member_name text;
update transactions set member_name = coalesce(member_name, '');
alter table transactions alter column member_name set not null;

alter table transactions drop column if exists member_id;

drop table if exists members;

create table if not exists members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now(),
  primary key (owner_id, name)
);

alter table members enable row level security;

create policy "members_select_own"
on members for select
using (auth.uid() = owner_id);

create policy "members_insert_own"
on members for insert
with check (auth.uid() = owner_id);

create policy "members_update_own"
on members for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "members_delete_own"
on members for delete
using (auth.uid() = owner_id);
```

## 6. Env setup

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 7. Run the project

From the repository root:

```bash
docker compose up --build
```

Open http://localhost:3000

## Notes

- Users are organization accounts that sign in to the app
- Members belong to an organization and are stored as names only
- Each transaction stores the chosen member name directly
- Each signed-in user only sees that user's own members and transactions
- Deleting a transaction now moves it into deleted history for 30 days, where it can still be restored

## Transaction delete history

Run the migration in `supabase/migrations/20260429_soft_delete_transactions.sql` to enable:

- Soft-delete fields on `transactions`
- Restore support from the app UI
- Restore activity logging so restored transactions remain traceable
- Automatic permanent cleanup for archived transactions after 30 days

If your Supabase project does not support `pg_cron`, keep the schema changes and run `select public.purge_expired_deleted_transactions();` from a scheduled job outside Supabase.
