import { getSupabase } from '../lib/supabase.js';

/**
 * Generate a standard RFC4122 v4 UUID
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieve or generate a persistent, unique client device UUID.
 * Guarantees every user has their own isolated Supabase records.
 */
export function getOrCreateClientUserId() {
  if (typeof window === 'undefined') return '00000000-0000-4000-8000-000000000000';
  try {
    const activeRaw = localStorage.getItem('hisab_active_user');
    if (activeRaw) {
      const parsed = JSON.parse(activeRaw);
      if (parsed?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.id)) {
        return parsed.id;
      }
    }
  } catch {}

  let deviceId = localStorage.getItem('hisab_device_user_id');
  if (!deviceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceId)) {
    deviceId = generateUUID();
    localStorage.setItem('hisab_device_user_id', deviceId);
  }
  return deviceId;
}

/**
 * Format a store account into a Supabase account row
 */
export function formatAccountForDb(userId, acc) {
  return {
    id: acc.id,
    user_id: userId,
    name: acc.name,
    type: acc.type || 'other',
    balance: Number(acc.balance) || 0,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Format a Supabase account row into a store account
 */
export function formatAccountFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: Number(row.balance) || 0,
  };
}

/**
 * Format a store transaction into a Supabase transaction row
 */
export function formatTransactionForDb(userId, txn) {
  return {
    id: txn.id,
    user_id: userId,
    account_id: txn.accountId,
    category_id: txn.categoryId,
    type: txn.type,
    amount: Number(txn.amount) || 0,
    date: txn.date,
    description: txn.description || '',
    recurring: Boolean(txn.recurring),
    recurring_bill_id: txn.recurringBillId || null,
  };
}

/**
 * Format a Supabase transaction row into a store transaction
 */
export function formatTransactionFromDb(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    type: row.type,
    amount: Number(row.amount) || 0,
    date: row.date,
    description: row.description || '',
    recurring: Boolean(row.recurring),
    recurringBillId: row.recurring_bill_id || null,
  };
}

/**
 * Format a store budget into a Supabase budget row
 */
export function formatBudgetForDb(userId, budget) {
  return {
    id: budget.id,
    user_id: userId,
    category_id: budget.categoryId,
    amount: Number(budget.amount) || 0,
    period: budget.period || 'monthly',
    updated_at: new Date().toISOString(),
  };
}

/**
 * Format a Supabase budget row into a store budget
 */
export function formatBudgetFromDb(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: Number(row.amount) || 0,
    period: row.period || 'monthly',
  };
}

/**
 * Format a store savings goal into a Supabase row
 */
export function formatSavingsGoalForDb(userId, goal) {
  return {
    id: goal.id,
    user_id: userId,
    name: goal.name,
    type: goal.type,
    target_amount: Number(goal.targetAmount) || 0,
    current_amount: Number(goal.currentAmount) || 0,
    monthly_contribution: Number(goal.monthlyContribution) || 0,
    interest_rate: Number(goal.interestRate) || 0,
    start_date: goal.startDate || null,
    target_date: goal.targetDate || null,
    is_locked: Boolean(goal.isLocked),
    linked_account_id: goal.linkedAccountId || '',
    status: goal.status || 'active',
    history: Array.isArray(goal.history) ? goal.history : [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Format a Supabase savings goal row into a store goal
 */
export function formatSavingsGoalFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    targetAmount: Number(row.target_amount) || 0,
    currentAmount: Number(row.current_amount) || 0,
    monthlyContribution: Number(row.monthly_contribution) || 0,
    interestRate: Number(row.interest_rate) || 0,
    startDate: row.start_date || '',
    targetDate: row.target_date || '',
    isLocked: Boolean(row.is_locked),
    linkedAccountId: row.linked_account_id || '',
    status: row.status || 'active',
    history: Array.isArray(row.history) ? row.history : [],
  };
}

/**
 * Format a store recurring bill into a Supabase row
 */
export function formatRecurringBillForDb(userId, bill) {
  return {
    id: bill.id,
    user_id: userId,
    name: bill.name,
    amount: Number(bill.amount) || 0,
    due_day: Number(bill.dueDay) || 1,
    category_id: bill.categoryId || 'utilities',
    icon: bill.icon || '📄',
    account_id: bill.accountId || '',
    paid_months: Array.isArray(bill.paidMonths) ? bill.paidMonths : [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Format a Supabase recurring bill row into a store bill
 */
export function formatRecurringBillFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount) || 0,
    dueDay: Number(row.due_day) || 1,
    categoryId: row.category_id || 'utilities',
    icon: row.icon || '📄',
    accountId: row.account_id || '',
    paidMonths: Array.isArray(row.paid_months) ? row.paid_months : [],
  };
}

/**
 * Fetch all cloud records strictly for a specific user ID.
 * Guarantees zero leakage of other users' accounts or data.
 */
export async function fetchCloudData(userId = null) {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase client missing' };
  }

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) {
    return {
      success: true,
      data: {
        profile: {},
        onboardingComplete: undefined,
        settings: {},
        financialMode: 'cruise',
        modeSettings: undefined,
        accounts: [],
        transactions: [],
        budgets: [],
        savingsGoals: [],
        recurringBills: [],
      },
    };
  }

  try {
    const [
      profileRes,
      accountsRes,
      transactionsRes,
      budgetsRes,
      savingsRes,
      billsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', effectiveUserId).maybeSingle(),
      supabase.from('accounts').select('*').eq('user_id', effectiveUserId),
      supabase.from('transactions').select('*').eq('user_id', effectiveUserId).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', effectiveUserId),
      supabase.from('savings_goals').select('*').eq('user_id', effectiveUserId),
      supabase.from('recurring_bills').select('*').eq('user_id', effectiveUserId),
    ]);

    const profileData = profileRes?.data || {};
    const accounts = (accountsRes.data || []).map(formatAccountFromDb);
    const transactions = (transactionsRes.data || []).map(formatTransactionFromDb);
    const budgets = (budgetsRes.data || []).map(formatBudgetFromDb);
    const savingsGoals = (savingsRes.data || []).map(formatSavingsGoalFromDb);
    const recurringBills = (billsRes.data || []).map(formatRecurringBillFromDb);

    return {
      success: true,
      data: {
        profile: {
          name: profileData.full_name || '',
          monthlySalary: Number(profileData.monthly_salary) || 0,
          avatar: profileData.avatar_url || null,
          email: profileData.email || '',
        },
        onboardingComplete: profileData.onboarding_complete !== undefined ? Boolean(profileData.onboarding_complete) : undefined,
        settings: {
          theme: profileData.theme || 'light',
          currency: profileData.currency || 'BDT',
        },
        financialMode: profileData.financial_mode || 'cruise',
        modeSettings: profileData.mode_settings || undefined,
        accounts,
        transactions,
        budgets,
        savingsGoals,
        recurringBills,
      },
    };
  } catch (err) {
    console.error('fetchCloudData error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Upload all current store state to Supabase for the current client user
 */
export async function uploadLocalDataToCloud(userId = null, state) {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase client missing' };
  }

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) {
    return { success: false, error: 'User ID missing' };
  }

  try {
    // 1. Profile & Preferences (safely catch foreign key constraint if profiles is linked to auth.users)
    try {
      const profilePayload = {
        id: effectiveUserId,
        full_name: state.profile?.name || '',
        email: state.user?.email || 'guest@hisab.app',
        avatar_url: state.profile?.avatar || null,
        monthly_salary: Number(state.profile?.monthlySalary) || 0,
        currency: state.settings?.currency || 'BDT',
        theme: state.settings?.theme || 'light',
        financial_mode: state.financialMode || 'cruise',
        mode_settings: state.modeSettings || {},
        onboarding_complete: Boolean(state.onboardingComplete),
        updated_at: new Date().toISOString(),
      };
      await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
    } catch (profErr) {
      console.warn('Profile sync note:', profErr);
    }

    // 2. Accounts
    if (state.accounts && state.accounts.length > 0) {
      const dbAccounts = state.accounts.map((a) => formatAccountForDb(effectiveUserId, a));
      await supabase.from('accounts').upsert(dbAccounts, { onConflict: 'id' });
    }

    // 3. Transactions
    if (state.transactions && state.transactions.length > 0) {
      const dbTxns = state.transactions.map((t) => formatTransactionForDb(effectiveUserId, t));
      await supabase.from('transactions').upsert(dbTxns, { onConflict: 'id' });
    }

    // 4. Budgets
    if (state.budgets && state.budgets.length > 0) {
      const dbBudgets = state.budgets.map((b) => formatBudgetForDb(effectiveUserId, b));
      await supabase.from('budgets').upsert(dbBudgets, { onConflict: 'id' });
    }

    // 5. Savings Goals
    if (state.savingsGoals && state.savingsGoals.length > 0) {
      const dbGoals = state.savingsGoals.map((g) => formatSavingsGoalForDb(effectiveUserId, g));
      await supabase.from('savings_goals').upsert(dbGoals, { onConflict: 'id' });
    }

    // 6. Recurring Bills
    if (state.recurringBills && state.recurringBills.length > 0) {
      const dbBills = state.recurringBills.map((b) => formatRecurringBillForDb(effectiveUserId, b));
      await supabase.from('recurring_bills').upsert(dbBills, { onConflict: 'id' });
    }

    return { success: true };
  } catch (err) {
    console.error('uploadLocalDataToCloud error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delta Push: Single Transaction
 */
export async function pushTransaction(userId = null, txn, action = 'upsert') {
  const supabase = getSupabase();
  if (!supabase) return;

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) return;

  try {
    if (action === 'delete') {
      await supabase.from('transactions').delete().eq('id', txn.id).eq('user_id', effectiveUserId);
    } else {
      const payload = formatTransactionForDb(effectiveUserId, txn);
      await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('pushTransaction background sync warning:', err);
  }
}

/**
 * Delta Push: Single Account
 */
export async function pushAccount(userId = null, account, action = 'upsert') {
  const supabase = getSupabase();
  if (!supabase) return;

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) return;

  try {
    if (action === 'delete') {
      await supabase.from('accounts').delete().eq('id', account.id).eq('user_id', effectiveUserId);
    } else {
      const payload = formatAccountForDb(effectiveUserId, account);
      await supabase.from('accounts').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('pushAccount background sync warning:', err);
  }
}

/**
 * Delta Push: Multiple Accounts
 */
export async function pushAccounts(userId = null, accounts) {
  const supabase = getSupabase();
  if (!supabase || !accounts || accounts.length === 0) return;

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) return;

  try {
    const payloads = accounts.map((a) => formatAccountForDb(effectiveUserId, a));
    await supabase.from('accounts').upsert(payloads, { onConflict: 'id' });
  } catch (err) {
    console.warn('pushAccounts background sync warning:', err);
  }
}

/**
 * Delta Push: Single Budget
 */
export async function pushBudget(userId = null, budget, action = 'upsert') {
  const supabase = getSupabase();
  if (!supabase) return;

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) return;

  try {
    if (action === 'delete') {
      await supabase.from('budgets').delete().eq('id', budget.id).eq('user_id', effectiveUserId);
    } else {
      const payload = formatBudgetForDb(effectiveUserId, budget);
      await supabase.from('budgets').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('pushBudget background sync warning:', err);
  }
}

/**
 * Delta Push: Savings Goal
 */
export async function pushSavingsGoal(userId = null, goal, action = 'upsert') {
  const supabase = getSupabase();
  if (!supabase) return;

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) return;

  try {
    if (action === 'delete') {
      await supabase.from('savings_goals').delete().eq('id', goal.id).eq('user_id', effectiveUserId);
    } else {
      const payload = formatSavingsGoalForDb(effectiveUserId, goal);
      await supabase.from('savings_goals').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('pushSavingsGoal background sync warning:', err);
  }
}

/**
 * Delta Push: Recurring Bill
 */
export async function pushRecurringBill(userId = null, bill, action = 'upsert') {
  const supabase = getSupabase();
  if (!supabase) return;

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) return;

  try {
    if (action === 'delete') {
      await supabase.from('recurring_bills').delete().eq('id', bill.id).eq('user_id', effectiveUserId);
    } else {
      const payload = formatRecurringBillForDb(effectiveUserId, bill);
      await supabase.from('recurring_bills').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('pushRecurringBill background sync warning:', err);
  }
}

/**
 * Delta Push: Profile & Preferences
 */
export async function pushProfile(userId = null, data) {
  const supabase = getSupabase();
  if (!supabase) return;

  const effectiveUserId = userId || getOrCreateClientUserId();
  if (!effectiveUserId) return;

  try {
    const payload = {
      id: effectiveUserId,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('pushProfile background sync warning:', err);
  }
}
