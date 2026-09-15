-- ============================================================================
-- HISAB (হিসাব) — SUPABASE DATABASE SCHEMA MIGRATION
-- Run this SQL in your Supabase Project -> SQL Editor to initialize tables,
-- Row Level Security (RLS) policies, and automated user profile triggers.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES TABLE
-- Mirrors authenticated users and stores personal finance preferences
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  monthly_salary NUMERIC(14, 2) DEFAULT 0,
  currency TEXT DEFAULT 'BDT',
  theme TEXT DEFAULT 'light',
  financial_mode TEXT DEFAULT 'cruise',
  mode_settings JSONB DEFAULT '{"eco": {"savingRate": 40, "defaultSavingRate": 40, "minRate": 30, "maxRate": 75}, "cruise": {"savingRate": 20, "defaultSavingRate": 20, "minRate": 15, "maxRate": 35}, "racing": {"savingRate": 5, "defaultSavingRate": 5, "minRate": 1, "maxRate": 15}}'::jsonb,
  onboarding_complete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACCOUNTS TABLE
-- Supports MFS (bKash, Nagad, Rocket), Banks (City Bank, DBBL), and Cash Wallets
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'mfs', 'bank', 'wallet', 'other'
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE
-- Incomes, expenses, transfers, adjustments with category & account references
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income', 'expense', 'transfer', 'adjustment'
  amount NUMERIC(14, 2) NOT NULL,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  description TEXT DEFAULT '',
  recurring BOOLEAN DEFAULT FALSE,
  recurring_bill_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUDGETS TABLE
-- Monthly limits allocated per category
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SAVINGS GOALS & LOCKED FUNDS TABLE
-- Tracks DPS, FDR, Emergency Funds, and purchase goals
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'dps', 'fdr', 'emergency', 'purchase', 'custom'
  target_amount NUMERIC(14, 2) NOT NULL,
  current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC(14, 2) DEFAULT 0,
  interest_rate NUMERIC(5, 2) DEFAULT 0,
  start_date TEXT,
  target_date TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  linked_account_id TEXT DEFAULT '',
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER-MANAGED RECURRING BILLS & SUBSCRIPTIONS
-- Rent, internet, utilities, Netflix, etc.
CREATE TABLE IF NOT EXISTS public.recurring_bills (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category_id TEXT,
  icon TEXT DEFAULT '📄',
  account_id TEXT DEFAULT '',
  paid_months TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_user_id ON public.recurring_bills(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: users can ONLY query and manipulate their own data
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts Policies
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;
CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets Policies
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
CREATE POLICY "Users can insert own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Savings Goals Policies
DROP POLICY IF EXISTS "Users can view own savings goals" ON public.savings_goals;
CREATE POLICY "Users can view own savings goals" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own savings goals" ON public.savings_goals;
CREATE POLICY "Users can insert own savings goals" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own savings goals" ON public.savings_goals;
CREATE POLICY "Users can update own savings goals" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own savings goals" ON public.savings_goals;
CREATE POLICY "Users can delete own savings goals" ON public.savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Recurring Bills Policies
DROP POLICY IF EXISTS "Users can view own recurring bills" ON public.recurring_bills;
CREATE POLICY "Users can view own recurring bills" ON public.recurring_bills
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recurring bills" ON public.recurring_bills;
CREATE POLICY "Users can insert own recurring bills" ON public.recurring_bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recurring bills" ON public.recurring_bills;
CREATE POLICY "Users can update own recurring bills" ON public.recurring_bills
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recurring bills" ON public.recurring_bills;
CREATE POLICY "Users can delete own recurring bills" ON public.recurring_bills
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- AUTOMATED USER CREATION TRIGGER
-- When a user signs in with Google OAuth or Email OTP, create a profile automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
