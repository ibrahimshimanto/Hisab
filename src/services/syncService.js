import { getSupabase } from '../lib/supabase.js';

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
 * Fetch all cloud records for an authenticated user
/**
 * Fetch all cloud records from Supabase
 */
export async function fetchCloudData(userId = null) {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase client missing' };
  }

  try {
    let accountsQuery = supabase.from('accounts').select('*');
    let txQuery = supabase.from('transactions').select('*').order('date', { ascending: false });
    let budgetsQuery = supabase.from('budgets').select('*');
    let savingsQuery = supabase.from('savings_goals').select('*');
    let billsQuery = supabase.from('recurring_bills').select('*');
    let profileQuery = userId ? supabase.from('profiles').select('*').eq('id', userId).maybeSingle() : Promise.resolve({ data: null });

    if (userId) {
      accountsQuery = accountsQuery.eq('user_id', userId);
      txQuery = txQuery.eq('user_id', userId);
      budgetsQuery = budgetsQuery.eq('user_id', userId);
      savingsQuery = savingsQuery.eq('user_id', userId);
      billsQuery = billsQuery.eq('user_id', userId);
    }

    const [
      profileRes,
      accountsRes,
      transactionsRes,
      budgetsRes,
      savingsRes,
      billsRes,
    ] = await Promise.all([
      profileQuery,
      accountsQuery,
      txQuery,
      budgetsQuery,
      savingsQuery,
      billsQuery,
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
 * Upload all current store state to Supabase in bulk
 */
export async function uploadLocalDataToCloud(userId = null, state) {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase client missing' };
  }

  try {
    // 1. Profile & Preferences (if user authenticated)
    if (userId) {
      const profilePayload = {
        id: userId,
        full_name: state.profile?.name || '',
        email: state.user?.email || '',
        monthly_salary: Number(state.profile?.monthlySalary) || 0,
        currency: state.settings?.currency || 'BDT',
        theme: state.settings?.theme || 'light',
        financial_mode: state.financialMode || 'cruise',
        mode_settings: state.modeSettings || {},
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
    }

    // 2. Accounts
    if (state.accounts && state.accounts.length > 0) {
      const dbAccounts = state.accounts.map((a) => formatAccountForDb(userId, a));
      await supabase.from('accounts').upsert(dbAccounts, { onConflict: 'id' });
    }

    // 3. Transactions
    if (state.transactions && state.transactions.length > 0) {
      const dbTxns = state.transactions.map((t) => formatTransactionForDb(userId, t));
      await supabase.from('transactions').upsert(dbTxns, { onConflict: 'id' });
    }

    // 4. Budgets
    if (state.budgets && state.budgets.length > 0) {
      const dbBudgets = state.budgets.map((b) => formatBudgetForDb(userId, b));
      await supabase.from('budgets').upsert(dbBudgets, { onConflict: 'id' });
    }

    // 5. Savings Goals
    if (state.savingsGoals && state.savingsGoals.length > 0) {
      const dbGoals = state.savingsGoals.map((g) => formatSavingsGoalForDb(userId, g));
      await supabase.from('savings_goals').upsert(dbGoals, { onConflict: 'id' });
    }

    // 6. Recurring Bills
    if (state.recurringBills && state.recurringBills.length > 0) {
      const dbBills = state.recurringBills.map((b) => formatRecurringBillForDb(userId, b));
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

  try {
    if (action === 'delete') {
      let q = supabase.from('transactions').delete().eq('id', txn.id);
      if (userId) q = q.eq('user_id', userId);
      await q;
    } else {
      const payload = formatTransactionForDb(userId, txn);
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

  try {
    if (action === 'delete') {
      let q = supabase.from('accounts').delete().eq('id', account.id);
      if (userId) q = q.eq('user_id', userId);
      await q;
    } else {
      const payload = formatAccountForDb(userId, account);
      await supabase.from('accounts').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('pushAccount background sync warning:', err);
  }
}

/**
 * Delta Push: Multiple Accounts (e.g. after a balance transfer or adjustments)
 */
export async function pushAccounts(userId = null, accounts) {
  const supabase = getSupabase();
  if (!supabase || !accounts || accounts.length === 0) return;

  try {
    const payloads = accounts.map((a) => formatAccountForDb(userId, a));
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

  try {
    if (action === 'delete') {
      let q = supabase.from('budgets').delete().eq('id', budget.id);
      if (userId) q = q.eq('user_id', userId);
      await q;
    } else {
      const payload = formatBudgetForDb(userId, budget);
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

  try {
    if (action === 'delete') {
      let q = supabase.from('savings_goals').delete().eq('id', goal.id);
      if (userId) q = q.eq('user_id', userId);
      await q;
    } else {
      const payload = formatSavingsGoalForDb(userId, goal);
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

  try {
    if (action === 'delete') {
      let q = supabase.from('recurring_bills').delete().eq('id', bill.id);
      if (userId) q = q.eq('user_id', userId);
      await q;
    } else {
      const payload = formatRecurringBillForDb(userId, bill);
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
  if (!supabase || !userId) return;

  try {
    const payload = {
      id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('pushProfile background sync warning:', err);
  }
}

