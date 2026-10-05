import { money, reviewData, localDateString } from './accounting.js';

export const DATA_KEYS = [
  'accounts',
  'transactions',
  'budgets',
  'categories',
  'adjustments',
  'profile',
  'settings',
  'financialMode',
  'modeSettings',
  'savingsGoals',
  'recurringBills',
  'tourCompleted',
  'onboardingComplete',
  'sidebarCollapsed',
];
export const snapshot = (state) =>
  JSON.parse(
    JSON.stringify(
      Object.fromEntries(DATA_KEYS.map((key) => [key, state[key]]))
    )
  );
export const createBackup = (state) => ({
  format: 'hisab-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  data: snapshot(state),
});

export function parseBackup(text) {
  const backup = JSON.parse(text);
  if (backup.format !== 'hisab-backup' || backup.version !== 1 || !backup.data)
    throw new Error('Choose a supported full Hisab backup (version 1).');
  const data = backup.data;
  for (const key of [
    'accounts',
    'transactions',
    'budgets',
    'adjustments',
    'savingsGoals',
    'recurringBills',
  ]) {
    if (!Array.isArray(data[key])) throw new Error(`Backup is missing ${key}.`);
    const ids = data[key].map((row) => row.id);
    if (
      ids.some((id) => typeof id !== 'string' || !id) ||
      new Set(ids).size !== ids.length
    )
      throw new Error(`Backup has invalid or duplicate IDs in ${key}.`);
  }
  for (const a of data.accounts) money(a.balance);
  for (const t of data.transactions) {
    money(t.amount, { positive: true });
    localDateString(t.date);
    if (!['income', 'expense'].includes(t.type) || !t.categoryId)
      throw new Error('Invalid transaction in backup.');
  }
  for (const b of data.budgets) money(b.limit ?? b.amount, { positive: true });
  for (const g of data.savingsGoals) {
    money(g.currentAmount, { nonnegative: true });
    money(g.targetAmount, { positive: true });
  }
  for (const b of data.recurringBills) {
    money(b.amount, { positive: true });
    if (!Number.isInteger(b.dueDay) || b.dueDay < 1 || b.dueDay > 31)
      throw new Error('Invalid bill due day.');
  }
  for (const key of DATA_KEYS)
    if (data[key] === undefined) throw new Error(`Backup is missing ${key}.`);
  money(data.profile?.monthlySalary, { nonnegative: true });
  for (const key of ['onboardingComplete', 'tourCompleted', 'sidebarCollapsed'])
    if (typeof data[key] !== 'boolean')
      throw new Error('Invalid backup preferences.');
  if (
    !data.categories ||
    !Array.isArray(data.categories.income) ||
    !Array.isArray(data.categories.expense) ||
    !data.profile ||
    !data.settings
  )
    throw new Error('Backup is incomplete.');
  if (
    !['eco', 'cruise', 'racing'].includes(data.financialMode) ||
    !['light', 'dark'].includes(data.settings.theme)
  )
    throw new Error('Invalid backup preferences.');
  for (const mode of ['eco', 'cruise', 'racing'])
    if (
      !data.modeSettings?.[mode] ||
      !Number.isFinite(data.modeSettings[mode].savingRate) ||
      data.modeSettings[mode].savingRate < 0 ||
      data.modeSettings[mode].savingRate > 100
    )
      throw new Error('Invalid savings preference in backup.');
  const issues = reviewData(data);

  return {
    data: snapshot(data),
    issues,
    summary: {
      accounts: data.accounts.length,
      transactions: data.transactions.length,
      budgets: data.budgets.length,
      goals: data.savingsGoals.length,
      bills: data.recurringBills.length,
      liquidTotal: data.accounts.reduce((sum, a) => sum + a.balance, 0),
    },
  };
}
