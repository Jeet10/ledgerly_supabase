# Ledgerly (Supabase Version)

A simple cash ledger app built with Next.js and Supabase. Track cash in/out transactions with notes, dates, and filtering capabilities.

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
  transaction_date timestamp not null default now(),
  created_at timestamp default now()
);

**If you already have the table with `transaction_date` as `date`, run this ALTER statement:**

```sql
ALTER TABLE transactions ALTER COLUMN transaction_date TYPE timestamp USING transaction_date::timestamp;
```

## 3. Env setup
Create `frontend/.env.local` with:

NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

## 4. Run project
From the repository root:

docker compose up --build

Open http://localhost:3000

## Notes
- Track cash in/out transactions with notes, dates, and timestamps
- Filter transactions by date and search notes
- View opening balance, current balance, total cash in, and total cash out
- Modern dark UI with responsive design
