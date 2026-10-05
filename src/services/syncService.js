import { getSupabase } from '../lib/supabase.js';
import { snapshot } from '../lib/backup.js';

export const generateUUID = () => crypto.randomUUID();
async function checked(request) {
  const timedRequest = request.abortSignal ? request.abortSignal(AbortSignal.timeout(15000)) : request;
  const result = await timedRequest;
  if (result.error) throw result.error;
  return result.data;
}
export async function uploadLocalDataToCloud(
  userId,
  state,
  revision = 0,
  operationId = generateUUID()
) {
  if (!userId)
    return { success: false, error: 'Sign in before saving to the cloud.' };
  try {
    const nextRevision = await checked(
      getSupabase().rpc('commit_hisab_workspace', {
        payload: snapshot(state),
        expected_revision: revision,
        operation_id: operationId,
      })
    );
    return { success: true, revision: Number(nextRevision) };
  } catch (error) {
    return {
      success: false,
      conflict: error.code === 'PT409',
      error:
        error.message ||
        'Cloud save failed. Your pending changes remain on this device.',
    };
  }
}
export async function fetchCloudData(userId) {
  if (!userId) return { success: false, error: 'Sign in to load your data.' };
  try {
    const db = getSupabase();
    const workspace = await checked(
      db
        .from('app_workspaces')
        .select('data,revision')
        .eq('user_id', userId)
        .maybeSingle()
    );
    if (workspace)
      return {
        success: true,
        data: workspace.data,
        revision: Number(workspace.revision),
        migrated: true,
      };
    const [profile, accounts, transactions, budgets, goals, bills] =
      await Promise.all([
        checked(db.from('profiles').select('*').eq('id', userId).maybeSingle()),
        ...[
          'accounts',
          'transactions',
          'budgets',
          'savings_goals',
          'recurring_bills',
        ].map((table) =>
          checked(db.from(table).select('*').eq('user_id', userId))
        ),
      ]);
    // Preserve every legacy row. No name-based cleanup or automatic balance repair.
    const data = {
      profile: {
        name: profile?.full_name || '',
        monthlySalary: Number(profile?.monthly_salary || 0),
        avatar: profile?.avatar_url || null,
      },
      settings: {
        theme: profile?.theme || 'light',
        currency: profile?.currency || 'BDT',
      },
      financialMode: profile?.financial_mode || 'cruise',
      ...(profile?.mode_settings
        ? { modeSettings: profile.mode_settings }
        : {}),
      onboardingComplete: Boolean(
        profile?.onboarding_complete || accounts.length
      ),
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        createdAt: a.created_at,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        accountId: t.account_id,
        categoryId: t.category_id,
        type: t.type,
        amount: Number(t.amount),
        date: t.date,
        description: t.description || '',
        recurring: t.recurring,
        recurringBillId: t.recurring_bill_id,
        createdAt: t.created_at,
      })),
      budgets: budgets.map((b) => ({
        id: b.id,
        categoryId: b.category_id,
        limit: Number(b.amount),
        period: b.period,
      })),
      savingsGoals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        type: g.type,
        targetAmount: Number(g.target_amount),
        currentAmount: Number(g.current_amount),
        monthlyContribution: Number(g.monthly_contribution),
        interestRate: Number(g.interest_rate),
        startDate: g.start_date,
        targetDate: g.target_date,
        isLocked: g.is_locked,
        linkedAccountId: g.linked_account_id,
        status: g.status,
        history: g.history || [],
        createdAt: g.created_at,
      })),
      recurringBills: bills.map((b) => ({
        id: b.id,
        name: b.name,
        amount: Number(b.amount),
        dueDay: b.due_day,
        categoryId: b.category_id,
        accountId: b.account_id,
        icon: b.icon,
        paidMonths: b.paid_months || [],
        createdAt: b.created_at,
      })),
    };
    return { success: true, data, revision: 0, migrated: false };
  } catch (error) {
    return {
      success: false,
      error:
        error.message ||
        'Could not load cloud data. Existing device data has been preserved.',
    };
  }
}
