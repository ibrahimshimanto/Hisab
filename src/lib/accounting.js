export const MAX_MONEY = 999999999999.99;

export function money(value, { positive = false, nonnegative = false } = {}) {
  if (
    !['number', 'string'].includes(typeof value) ||
    value === '' ||
    value === null ||
    value === undefined ||
    typeof value === 'boolean'
  )
    throw new Error('Enter a valid amount.');
  if (typeof value === 'string' && !/^[+-]?\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new Error('Use an amount with at most two decimal places.');
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > MAX_MONEY)
    throw new Error('Amount is outside the supported range.');
  const rounded = Math.round(number * 100) / 100;
  if (Math.abs(number - rounded) > 0.000001)
    throw new Error('Use at most two decimal places.');
  if (positive && rounded <= 0)
    throw new Error('Amount must be greater than zero.');
  if (nonnegative && rounded < 0) throw new Error('Amount cannot be negative.');
  return rounded;
}

export const addMoney = (left, right) =>
  money((Math.round(money(left) * 100) + Math.round(money(right) * 100)) / 100);
export const isIncome = (transaction) =>
  transaction.type === 'income' &&
  (!transaction.kind || transaction.kind === 'income');
export const isExpense = (transaction) =>
  (transaction.type === 'expense' &&
    (!transaction.kind || transaction.kind === 'expense')) ||
  transaction.kind === 'refund';
export const expenseAmount = (transaction) =>
  transaction.kind === 'refund' ? -transaction.amount : transaction.amount;
export const accountDelta = (transaction) =>
  transaction.type === 'income' ? transaction.amount : -transaction.amount;

export function requireAccount(accounts, id) {
  const account = accounts.find((item) => item.id === id);
  if (!account) throw new Error('Choose an existing account.');
  return account;
}

export function localDateString(value = new Date()) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Choose a valid date.');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    )
      return new Date(NaN);
    return date;
  }
  return new Date(value);
}

export function validateTransaction(transaction, accounts) {
  if (!['income', 'expense'].includes(transaction.type))
    throw new Error('Choose income or expense.');
  requireAccount(accounts, transaction.accountId);
  if (!transaction.categoryId) throw new Error('Choose a category.');
  return {
    ...transaction,
    amount: money(transaction.amount, { positive: true }),
    date: localDateString(transaction.date),
    description: transaction.description || transaction.note || '',
  };
}

export function reviewData(data) {
  const issues = [];
  const accounts = new Set((data.accounts || []).map((a) => a.id));
  for (const transaction of data.transactions || []) {
    if (!accounts.has(transaction.accountId))
      issues.push({
        id: transaction.id,
        reason:
          'Account is missing; review its original account before making corrections.',
      });
    try {
      money(transaction.amount, { positive: true });
    } catch {
      issues.push({
        id: transaction.id,
        reason: 'Invalid amount; original record preserved.',
      });
    }
    if (!transaction.kind)
      issues.push({
        id: transaction.id,
        reason:
          'This legacy record has no confirmed classification. Review whether it is earned income, spending, opening capital, or movement of your own funds.',
      });
  }
  return issues;
}
