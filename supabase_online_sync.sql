-- ============================================================================
-- HISAB (হিসাব) — AUTOMATIC ONLINE & CLOUD-SYNC MIGRATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/wdxcfikuufscmweaqxyb/sql)
-- This enables 100% online cloud sync immediately for all devices.
-- ============================================================================

-- 1. Make user_id nullable across tables so devices sync immediately without auth
ALTER TABLE public.accounts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.savings_goals ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.recurring_bills ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop strict foreign key constraints if they exist
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;
ALTER TABLE public.savings_goals DROP CONSTRAINT IF EXISTS savings_goals_user_id_fkey;
ALTER TABLE public.recurring_bills DROP CONSTRAINT IF EXISTS recurring_bills_user_id_fkey;

-- 3. Disable Row Level Security so online cloud sync works automatically for every device
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. In case RLS is re-enabled in the future, create universal open policies
DROP POLICY IF EXISTS "Allow online sync accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;
CREATE POLICY "Allow online sync accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow online sync transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Allow online sync transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow online sync budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Allow online sync budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow online sync savings" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can view own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can delete own savings goals" ON public.savings_goals;
CREATE POLICY "Allow online sync savings" ON public.savings_goals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow online sync bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Users can view own recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Users can insert own recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Users can update own recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Users can delete own recurring bills" ON public.recurring_bills;
CREATE POLICY "Allow online sync bills" ON public.recurring_bills FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow online sync profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Allow online sync profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

