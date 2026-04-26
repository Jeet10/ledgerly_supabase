# Ledgerly (Supabase Version)

A simple customer ledger app built with Next.js and Supabase. Track customers, balances, and transaction history with a modern frontend interface.

## 1. Setup Supabase
- Go to https://supabase.com
- Create a new project
- Copy the Project URL and the `anon` public API key

## 2. Create table
Run this SQL in the Supabase SQL editor:

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  amount numeric not null,
  type text not null check (type in ('in', 'out')),
  note text,
  created_at timestamp default now()
);

## 3. Env setup
Create `frontend/.env.local` with:

NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

## 4. Run project
From the repository root:

docker compose up --build

Open http://localhost:3000

## Notes
- The frontend is already wired to Supabase for customers and transaction records.
- Use the app to add customers, record credits and debits, and watch balances update live.
