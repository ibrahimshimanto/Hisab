import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reviewData,
  money,
  addMoney,
  localDateString,
  parseDate,
  isIncome,
  isExpense,
} from '../src/lib/accounting.js';
import { previewCSV, exportCSV, parseCSV } from '../src/lib/csv.js';
import { createBackup, parseBackup, snapshot } from '../src/lib/backup.js';
import store from '../src/store/useStore.js';
import { getSupabase } from '../src/lib/supabase.js';
const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) || null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
const db = getSupabase();
let serverRevision = 0;
let fail = false;
let conflict = false;
let calls = [];
const receipts = new Map();
db.rpc = async (_name, request) => {
  calls.push(request);
  if (fail) return { error: { message: 'Network unavailable' } };
  if (conflict)
    return { error: { code: 'PT409', message: 'Newer cloud copy' } };
  if (receipts.has(request.operation_id))
    return { data: receipts.get(request.operation_id) };
  if (request.expected_revision !== serverRevision)
    return { error: { code: 'PT409', message: 'Revision conflict' } };
  serverRevision++;
  receipts.set(request.operation_id, serverRevision);
  return { data: serverRevision };
};
const base = snapshot(store.getState());
function reset() {
  store.setState({
    ...structuredClone(base),
    user: { id: 'test-user-a' },
    dataLoaded: true,
    revision: serverRevision,
    pendingSave: null,
    syncStatus: 'synced',
    syncError: '',
    financialError: '',
  });
}
async function save() {
  assert.equal(await store.getState().syncToCloud(), true);
}
const s = () => store.getState();
test('strict money validation and decimal arithmetic', () => {
  for (const value of [
    -1,
    0,
    Infinity,
    NaN,
    '3.001',
    '3x',
    null,
    '',
    true,
    {},
    1e12,
  ])
    assert.throws(() => money(value, { positive: true }));
  assert.equal(money('0.01', { positive: true }), 0.01);
  assert.equal(addMoney(0.1, 0.2), 0.3);
});
test('civil dates keep their calendar day and reject rollover', () => {
  assert.equal(localDateString(parseDate('2026-03-01')), '2026-03-01');
  assert.throws(() => localDateString('2026-02-30'));
});
test('opening balances, transaction reversal, transfer and savings preserve money', async () => {
  reset();
  assert.equal(
    s().addAccount({ name: 'Test wallet', balance: 1000, type: 'wallet' }),
    true
  );
  const a = s().accounts[0].id;
  assert.equal(
    s().getMonthlyIncome(new Date().getFullYear(), new Date().getMonth()),
    0
  );
  assert.equal(
    s().addAccount({ name: 'Test wallet', balance: 0, type: 'wallet' }),
    true
  );
  assert.equal(s().accounts.length, 2);
  const b = s().accounts[1].id;
  const before = snapshot(s());
  assert.equal(
    s().addTransaction({
      type: 'expense',
      amount: -50,
      accountId: a,
      categoryId: 'food',
      date: '2026-03-01',
    }),
    false
  );
  assert.deepEqual(snapshot(s()), before);
  assert.equal(
    s().addTransaction({
      type: 'expense',
      amount: 100,
      accountId: a,
      categoryId: 'food',
      date: '2026-03-01',
    }),
    true
  );
  let t = s().transactions[0];
  assert.equal(s().accounts[0].balance, 900);
  assert.equal(
    s().updateTransaction(t.id, {
      type: 'income',
      amount: 25,
      accountId: b,
      categoryId: 'gift',
    }),
    true
  );
  assert.equal(s().accounts[0].balance, 1000);
  assert.equal(s().accounts[1].balance, 25);
  assert.equal(s().deleteTransaction(t.id), true);
  assert.equal(s().accounts[1].balance, 0);
  assert.equal(s().transferBetweenAccounts(a, b, 200), true);
  assert.equal(s().getTotalBalance(), 1000);
  assert.equal(s().transactions.filter(isIncome).length, 0);
  assert.equal(s().transactions.filter(isExpense).length, 0);
  assert.equal(s().transferBetweenAccounts(a, a, 1), false);
  assert.equal(s().transferBetweenAccounts(a, b, -1), false);
  assert.equal(
    s().addSavingsGoal({
      name: 'Home Rent',
      targetAmount: 500,
      currentAmount: 100,
      linkedAccountId: a,
      type: 'custom',
    }),
    true
  );
  const g = s().savingsGoals[0].id;
  assert.equal(s().getTotalBalance() + s().getTotalSavings(), 1000);
  assert.equal(s().withdrawFromSavingsGoal(g, 101, b), false);
  assert.equal(s().depositToSavingsGoal(g, 50, a), true);
  assert.equal(s().withdrawFromSavingsGoal(g, 75, b), true);
  assert.equal(s().getTotalBalance() + s().getTotalSavings(), 1000);
  assert.equal(s().deleteSavingsGoal(g), false);
  assert.equal(s().deleteAccount(a), false);
  await save();
});
test('repeat form submissions apply a stable operation only once', async () => {
  reset();
  const account = {
    id: 'stable-account',
    name: 'Wallet',
    balance: 100,
    type: 'wallet',
  };
  assert.equal(s().addAccount(account), true);
  assert.equal(s().addAccount(account), true);
  assert.equal(s().accounts.length, 1);
  const transaction = {
    id: 'stable-txn',
    type: 'expense',
    amount: 10,
    categoryId: 'food',
    accountId: account.id,
    date: '2026-03-01',
  };
  assert.equal(s().addTransaction(transaction), true);
  assert.equal(s().addTransaction(transaction), true);
  assert.equal(s().accounts[0].balance, 90);
  assert.equal(s().transactions.filter((t) => t.id === 'stable-txn').length, 1);
  await save();
});
test('refund offsets expense and invalid budgets leave state unchanged', async () => {
  reset();
  s().addAccount({ name: 'Wallet', balance: 0, type: 'wallet' });
  const a = s().accounts[0].id;
  s().addTransaction({
    type: 'expense',
    amount: 20,
    accountId: a,
    categoryId: 'food',
    date: '2026-03-01',
  });
  assert.equal(
    s().addTransaction({
      type: 'income',
      kind: 'refund',
      amount: 5,
      accountId: a,
      categoryId: 'food',
      date: '2026-03-01',
    }),
    true
  );
  assert.equal(s().getMonthlyIncome(2026, 2), 0);
  assert.equal(s().getMonthlyExpense(2026, 2), 15);
  assert.equal(s().getCategorySpending(2026, 2).food, 15);
  const before = snapshot(s());
  assert.equal(s().addBudget({ categoryId: 'food', limit: -10 }), false);
  assert.deepEqual(snapshot(s()), before);
  await save();
});
test('CSV quote roundtrip, account matching, duplicates and atomic balance update', async () => {
  reset();
  s().addAccount({ name: 'Wallet', balance: 100, type: 'wallet' });
  const a = s().accounts[0].id;
  const text =
    'Date,Type,Category,Amount,Description,Account\r\n2026-03-01,expense,food,10,"Lunch, \"\"special\"\"\nnext line",Wallet';
  const preview = previewCSV(text, s().accounts, s().categories, []);
  assert.equal(preview.errors.length, 0);
  assert.equal(
    preview.transactions[0].description,
    'Lunch, "special"\nnext line'
  );
  assert.equal(s().importTransactions(preview.transactions), true);
  assert.equal(s().accounts[0].balance, 90);
  const round = previewCSV(
    exportCSV(s().transactions, s().accounts),
    s().accounts,
    s().categories,
    []
  );
  assert.equal(round.transactions.length, 1);
  assert.equal(round.errors.length, 0);
  const before = snapshot(s());
  assert.equal(s().importTransactions(preview.transactions), false);
  assert.deepEqual(snapshot(s()), before);
  assert.equal(
    previewCSV(text, s().accounts, s().categories, s().transactions).errors
      .length,
    1
  );
  assert.equal(
    previewCSV(text.replace('Wallet', 'Missing'), s().accounts, s().categories)
      .errors.length,
    1
  );
  assert.throws(() => parseCSV('a,b\n"oops'));
  assert.equal(
    previewCSV(text.replace(',10,', ',-10,'), s().accounts, s().categories)
      .errors.length,
    1
  );
  await save();
});
test('recurring payment is idempotent for its month', async () => {
  reset();
  s().addAccount({ name: 'Wallet', balance: 100, type: 'wallet' });
  const a = s().accounts[0].id;
  s().addRecurringBill({
    name: 'Netflix Subscription',
    amount: 10,
    dueDay: 1,
    categoryId: 'subscriptions',
    accountId: a,
  });
  const b = s().recurringBills[0].id;
  assert.equal(s().payRecurringBill(b, { date: '2026-03-01' }), true);
  assert.equal(s().payRecurringBill(b, { date: '2026-03-01' }), false);
  assert.equal(s().accounts[0].balance, 90);
  assert.equal(s().recurringBills.length, 1);
  await save();
});
test('legacy review preserves originals and balances while confirming classification', async () => {
  reset();
  s().addAccount({ name: 'Wallet', balance: 100 });
  const account = s().accounts[0].id;
  store.setState({
    transactions: [
      {
        id: 'legacy-opening',
        type: 'income',
        amount: 100,
        accountId: account,
        categoryId: 'salary',
        date: '2026-03-01',
      },
    ],
  });
  const old = s().accounts[0].balance;
  assert.equal(reviewData(s()).length, 1);
  assert.equal(
    s().reviewLegacyTransaction('legacy-opening', {
      accountId: account,
      kind: 'opening',
    }),
    true
  );
  assert.equal(s().accounts[0].balance, old);
  assert.equal(s().getMonthlyIncome(2026, 2), 0);
  assert.equal(reviewData(s()).length, 0);
  assert.equal(s().adjustments.length, 1);
  await save();
});
test('full backup roundtrips all persisted fields and rejects malformed values', async () => {
  s().addCustomCategory('expense', 'Synthetic category');
  s().updateProfile({ name: 'Synthetic user', monthlySalary: 250 });
  s().updateSettings({ language: 'bn' });
  s().completeOnboarding();
  const data = snapshot(s());
  const backup = createBackup(s());
  assert.deepEqual(parseBackup(JSON.stringify(backup)).data, data);
  assert.equal(backup.data.session, undefined);
  const broken = structuredClone(backup);
  broken.data.budgets = [{ id: 'bad', limit: -1 }];
  assert.throws(() => parseBackup(JSON.stringify(broken)));
  s().addBudget({ categoryId: 'food', limit: 30 });
  assert.equal(s().restoreBackup(data), true);
  assert.deepEqual(snapshot(s()), data);
  assert.ok(memory.get('hisab-before-restore:test-user-a'));
  await save();
});
test('failed saves survive reload; retry keeps operation ID; conflicts preserve pending records', async () => {
  reset();
  fail = true;
  s().addAccount({ name: 'Pending wallet', balance: 10 });
  assert.equal(await s().syncToCloud(), false);
  assert.equal(s().syncStatus, 'error');
  const operation = s().pendingSave.operationId;
  const cached = JSON.parse(memory.get('hisab-data:test-user-a'));
  assert.equal(cached.pending.operationId, operation);
  assert.equal(cached.data.accounts.length, 1);
  fail = false;
  await save();
  assert.equal(calls.at(-1).operation_id, operation);
  assert.equal(s().syncStatus, 'synced');
  conflict = true;
  s().addBudget({ categoryId: 'food', limit: 5 });
  assert.equal(await s().syncToCloud(), false);
  assert.equal(s().syncStatus, 'conflict');
  assert.equal(s().budgets.length, 1);
  assert.equal(s().addAccount({ name: 'Blocked', balance: 0 }), false);
  conflict = false;
});
test('account switches clear stale data and late cloud responses cannot cross users', async () => {
  reset();
  globalThis.window = {
    location: { href: 'https://example.test/' },
    history: { replaceState() {} },
  };
  globalThis.document = { title: 'Test' };
  let callback;
  db.auth.getSession = async () => ({
    data: { session: { user: { id: 'test-user-a' } } },
  });
  db.auth.onAuthStateChange = (cb) => {
    callback = cb;
    return {};
  };
  const resolves = {};
  db.from = () => ({
    select: () => ({
      eq: (_key, user) => ({
        maybeSingle: () =>
          new Promise((resolve) => {
            resolves[user] = resolve;
          }),
      }),
    }),
  });
  await s().initAuth();
  callback('SIGNED_IN', { user: { id: 'test-user-b' } });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(s().accounts.length, 0);
  assert.equal(s().user.id, 'test-user-b');
  callback('SIGNED_IN', { user: { id: 'test-user-c' } });
  await new Promise((r) => setTimeout(r, 10));
  resolves['test-user-b']({
    data: {
      data: { ...base, accounts: [{ id: 'foreign', name: 'B', balance: 100 }] },
      revision: 1,
    },
  });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(s().accounts.length, 0);
  resolves['test-user-c']({ data: { data: base, revision: 1 } });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(s().user.id, 'test-user-c');
  assert.equal(s().accounts.length, 0);
  callback('SIGNED_OUT', null);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(s().user, null);
  assert.equal(s().accounts.length, 0);
});
