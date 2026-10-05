import { create } from 'zustand';
import { getSupabase } from '../lib/supabase.js';
import {
  uploadLocalDataToCloud,
  fetchCloudData,
} from '../services/syncService.js';
import { snapshot, createBackup } from '../lib/backup.js';
import {
  money,
  addMoney,
  accountDelta,
  validateTransaction,
  requireAccount,
  localDateString,
  parseDate,
  isIncome,
  isExpense,
  expenseAmount,
} from '../lib/accounting.js';
import { transactionSignature } from '../lib/csv.js';

export const defaultAccounts = [];
export const defaultSavingsGoals = [];
export const defaultRecurringBills = [];
export const defaultModeSettings = {
  eco: { savingRate: 40, defaultSavingRate: 40, minRate: 30, maxRate: 75 },
  cruise: { savingRate: 20, defaultSavingRate: 20, minRate: 15, maxRate: 35 },
  racing: { savingRate: 5, defaultSavingRate: 5, minRate: 1, maxRate: 15 },
};
const defaultCategories = {
  expense: [
    'rent',
    'food',
    'transport',
    'utilities',
    'entertainment',
    'health',
    'education',
    'shopping',
    'subscriptions',
    'savings',
  ].map((id, i) => ({
    id,
    key: id,
    color: [
      '#F87171',
      '#FB923C',
      '#FBBF24',
      '#34D399',
      '#A78BFA',
      '#F472B6',
      '#60A5FA',
      '#E879F9',
      '#818CF8',
      '#5ED21C',
    ][i],
  })),
  income: ['salary', 'freelance', 'business', 'investment', 'gift'].map(
    (id, i) => ({
      id,
      key: id,
      color: ['#4ADE80', '#22D3EE', '#2DD4BF', '#FCD34D', '#FB7185'][i],
    })
  ),
  // 'Other Income' is an existing account-form choice.
};
defaultCategories.income.push({
  id: 'other',
  key: 'other',
  label: 'Other income',
  custom: true,
  color: '#94A3B8',
});
function withDefaults(data = {}) {
  const result = { ...fresh(), ...data };
  if (data.categories)
    result.categories = Object.fromEntries(
      ['income', 'expense'].map((type) => [
        type,
        [
          ...data.categories[type],
          ...defaultCategories[type].filter(
            (c) => !data.categories[type].some((old) => old.id === c.id)
          ),
        ],
      ])
    );
  return result;
}
const initialData = {
  accounts: [],
  transactions: [],
  budgets: [],
  adjustments: [],
  categories: defaultCategories,
  savingsGoals: [],
  recurringBills: [],
  profile: { name: '', monthlySalary: 0, avatar: null },
  settings: { theme: 'light', currency: 'BDT' },
  financialMode: 'cruise',
  modeSettings: defaultModeSettings,
  onboardingComplete: false,
  tourCompleted: false,
  sidebarCollapsed: false,
};
const initialUI = {
  user: null,
  session: null,
  isAuthLoading: true,
  syncStatus: 'offline',
  syncError: '',
  financialError: '',
  lastSyncedAt: null,
  revision: 0,
  dataLoaded: false,
  pendingSave: null,
  authModalOpen: false,
  isSidebarOpen: false,
  voiceModal: { isOpen: false },
  quickAddModal: { isOpen: false, type: 'expense' },
  savingsModal: { isOpen: false, editGoal: null },
  depositModal: { isOpen: false, goal: null, mode: 'deposit' },
  calculatorModal: { isOpen: false, initialData: null },
  isTourOpen: false,
  tourStep: 0,
};
const fresh = () => JSON.parse(JSON.stringify(initialData));
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const key = (userId) => `hisab-data:${userId}`;
let initPromise,
  syncPromise,
  syncOwner,
  syncTimer,
  authGeneration = 0;
function readCache(userId) {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) || 'null');
  } catch {
    return null;
  }
}
function persist(state) {
  if (!state.user?.id) return;
  localStorage.setItem(
    key(state.user.id),
    JSON.stringify({
      data: snapshot(state),
      revision: state.revision,
      pending: state.pendingSave,
      pendingChanges: state.syncStatus !== 'synced',
    })
  );
}
function balance(accounts, accountId, delta) {
  requireAccount(accounts, accountId);
  return accounts.map((a) =>
    a.id === accountId ? { ...a, balance: addMoney(a.balance, delta) } : a
  );
}
function txn(state, data) {
  const result = validateTransaction(data, state.accounts);
  if (
    !(
      state.categories[result.kind === 'refund' ? 'expense' : result.type] || []
    ).some((c) => c.id === result.categoryId)
  )
    throw new Error('Choose a category for this transaction type.');
  return {
    ...result,
    kind: data.kind || data.type,
    id: data.id || id(),
    createdAt: data.createdAt || now(),
  };
}
function goalAmounts(data) {
  return {
    ...data,
    currentAmount: money(data.currentAmount ?? 0, { nonnegative: true }),
    targetAmount: money(data.targetAmount, { positive: true }),
    monthlyContribution: money(data.monthlyContribution ?? 0, {
      nonnegative: true,
    }),
    interestRate: money(data.interestRate ?? 0, { nonnegative: true }),
  };
}
const useStore = create((set, get) => {
  const commit = (change) => {
    try {
      const state = get();
      if (!state.user || !state.dataLoaded)
        throw new Error(
          'Wait for your account data to load before making changes.'
        );
      if (state.syncStatus === 'conflict')
        throw new Error(
          'Export pending changes and reload the cloud copy before editing.'
        );
      const patch = typeof change === 'function' ? change(state) : change;
      set({
        ...patch,
        financialError: '',
        syncStatus: 'pending',
        syncError: '',
      });
      try {
        persist(get());
      } catch {
        set({
          syncStatus: 'error',
          syncError:
            'Device storage is full or unavailable. Keep this page open, export a backup, and retry cloud save.',
        });
      }
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => get().syncToCloud(), 350);
      return true;
    } catch (error) {
      set({ financialError: error.message });
      return false;
    }
  };
  const loadSession = async (session) => {
    const user = session?.user || null;
    if (user?.id === get().user?.id && get().dataLoaded) {
      set({ session, user });
      return;
    }
    const generation = ++authGeneration;
    clearTimeout(syncTimer);
    if (!user) {
      set({ ...fresh(), ...initialUI, isAuthLoading: false });
      return;
    }
    const cache = readCache(user.id);
    set({
      ...fresh(),
      ...initialUI,
      ...withDefaults(cache?.data),
      user,
      session,
      revision: cache?.revision || 0,
      pendingSave: cache?.pending || null,
      dataLoaded: Boolean(cache),
      isAuthLoading: true,
      syncStatus: 'syncing',
    });
    const result = await fetchCloudData(user.id);
    if (generation !== authGeneration || get().user?.id !== user.id) return;
    if (!result.success) {
      set({
        isAuthLoading: false,
        syncStatus: 'error',
        syncError: result.error,
      });
      return;
    }
    if (cache?.pendingChanges || cache?.pending) {
      set({ isAuthLoading: false, dataLoaded: true, syncStatus: 'pending' });
      get().syncToCloud();
    } else {
      set({
        ...fresh(),
        ...withDefaults(result.data),
        revision: result.revision,
        pendingSave: null,
        dataLoaded: true,
        isAuthLoading: false,
        syncStatus: 'synced',
        lastSyncedAt: now(),
      });
      try {
        persist(get());
      } catch {
        set({
          syncError:
            'Device backup could not be saved. Cloud data is available.',
        });
      }
    }
  };
  return {
    ...fresh(),
    ...initialUI,
    clearFinancialError: () => set({ financialError: '' }),
    setAuthModalOpen: (open) => set({ authModalOpen: Boolean(open) }),
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setSyncStatus: (syncStatus) => set({ syncStatus }),
    initAuth: () => {
      if (initPromise) return initPromise;
      initPromise = (async () => {
        try {
          const db = getSupabase();
          if (!db) throw new Error('Cloud connection is not configured.');
          const url = new URL(window.location.href);
          let session;
          if (url.searchParams.has('code')) {
            const result = await db.auth.exchangeCodeForSession(
              url.searchParams.get('code')
            );
            if (result.error) throw result.error;
            session = result.data.session;
            url.searchParams.delete('code');
          } else if (url.searchParams.has('token_hash')) {
            const result = await db.auth.verifyOtp({
              token_hash: url.searchParams.get('token_hash'),
              type: url.searchParams.get('type') || 'email',
            });
            if (result.error) throw result.error;
            session = result.data.session;
            url.searchParams.delete('token_hash');
            url.searchParams.delete('type');
          }
          if (session)
            window.history.replaceState(
              {},
              document.title,
              url.pathname + url.search + url.hash
            );
          const result = await db.auth.getSession();
          if (result.error) throw result.error;
          await loadSession(session || result.data.session);
          // Defer cloud work outside Supabase's auth callback lock.
          db.auth.onAuthStateChange((_event, next) => {
            setTimeout(() => loadSession(next), 0);
          });
        } catch (error) {
          set({
            isAuthLoading: false,
            syncStatus: 'error',
            syncError: error.message,
          });
          initPromise = null;
        }
      })();
      return initPromise;
    },
    hydrateFromCloud: (data) => set({ ...fresh(), ...data }),
    syncToCloud: async () => {
      const owner = get().user?.id;
      if (!owner || !get().dataLoaded) return false;
      if (syncPromise && syncOwner === owner) return syncPromise;
      if (get().syncStatus === 'conflict') return false;
      syncOwner = owner;
      syncPromise = (async () => {
        try {
          do {
            if (get().user?.id !== owner) return false;
            const pending = get().pendingSave || {
              data: snapshot(get()),
              operationId: id(),
            };
            set({ pendingSave: pending, syncStatus: 'syncing', syncError: '' });
            try {
              persist(get());
            } catch {
              set({
                syncError:
                  'Device storage is unavailable. Export a backup while this page stays open.',
              });
            }
            const result = await uploadLocalDataToCloud(
              owner,
              pending.data,
              get().revision,
              pending.operationId
            );
            if (get().user?.id !== owner) return false;
            if (!result.success) {
              set({
                syncStatus: result.conflict ? 'conflict' : 'error',
                syncError: result.error,
              });
              try {
                persist(get());
              } catch {}
              return false;
            }
            const changed =
              JSON.stringify(snapshot(get())) !== JSON.stringify(pending.data);
            set({
              revision: result.revision,
              pendingSave: null,
              syncStatus: changed ? 'pending' : 'synced',
              lastSyncedAt: now(),
              syncError: '',
            });
            try {
              persist(get());
            } catch {
              set({
                syncError: 'Cloud saved. Device backup could not be saved.',
              });
            }
          } while (get().syncStatus === 'pending');
          return true;
        } finally {
          if (syncOwner === owner) {
            syncPromise = null;
            syncOwner = null;
          }
        }
      })();
      return syncPromise;
    },
    syncFromCloud: async () => {
      if (get().syncStatus !== 'synced' && get().dataLoaded) {
        set({
          syncError:
            'Export a full backup of pending changes before choosing Reload cloud copy.',
        });
        return false;
      }
      return get().reloadCloudCopy();
    },
    reloadCloudCopy: async () => {
      const owner = get().user?.id;
      if (!owner) return false;
      if (get().dataLoaded && get().syncStatus !== 'synced') {
        try {
          localStorage.setItem(
            `hisab-before-reload:${owner}`,
            JSON.stringify(createBackup(get()))
          );
        } catch {
          set({
            syncError:
              'Could not preserve pending data. Export a backup before replacing this copy.',
          });
          return false;
        }
      }
      const result = await fetchCloudData(owner);
      if (get().user?.id !== owner) return false;
      if (!result.success) {
        set({ syncStatus: 'error', syncError: result.error });
        return false;
      }
      set({
        ...fresh(),
        ...withDefaults(result.data),
        revision: result.revision,
        pendingSave: null,
        dataLoaded: true,
        syncStatus: 'synced',
        syncError: '',
        financialError: '',
        lastSyncedAt: now(),
      });
      try {
        persist(get());
      } catch {}
      return true;
    },
    signOut: async () => {
      try {
        persist(get());
      } catch {
        if (get().syncStatus !== 'synced') {
          set({
            syncError:
              'Pending data could not be preserved. Export a backup before signing out.',
          });
          return false;
        }
      }
      const result = await getSupabase().auth.signOut();
      if (result.error) {
        set({ syncError: result.error.message });
        return false;
      }
      await loadSession(null);
      return true;
    },
    toggleSidebar: () =>
      commit((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarCollapsed: (v) => commit({ sidebarCollapsed: v }),
    openVoiceModal: () => set({ voiceModal: { isOpen: true } }),
    closeVoiceModal: () => set({ voiceModal: { isOpen: false } }),
    setFinancialMode: (mode) => commit({ financialMode: mode }),
    updateModeTarget: (mode, rate) =>
      commit((s) => {
        const config = s.modeSettings[mode];
        return {
          modeSettings: {
            ...s.modeSettings,
            [mode]: {
              ...config,
              savingRate: Math.min(
                config.maxRate,
                Math.max(config.minRate, Number(rate))
              ),
            },
          },
        };
      }),
    resetModeTarget: (mode) =>
      get().updateModeTarget(mode, defaultModeSettings[mode].defaultSavingRate),
    addTransactionFromVoice: (parsed) => {
      const account = requireAccount(
        get().accounts,
        parsed.accountId || get().accounts[0]?.id
      );
      const success =
        parsed.type === 'adjust'
          ? get().adjustAccountBalance(
              account.id,
              parsed.amount,
              parsed.note || 'Voice adjustment'
            )
          : get().addTransaction({
              ...parsed,
              accountId: account.id,
              categoryId:
                parsed.categoryId ||
                (parsed.type === 'income' ? 'salary' : 'food'),
              date: localDateString(),
            });
      return {
        success,
        type: parsed.type,
        amount: parsed.amount,
        accountName: account.name,
      };
    },
    openQuickAdd: (type = 'expense') =>
      set({ quickAddModal: { isOpen: true, type } }),
    closeQuickAdd: () =>
      set({ quickAddModal: { isOpen: false, type: 'expense' } }),
    addAccount: (data) =>
      commit((s) => {
        if (data.id && s.accounts.some((a) => a.id === data.id)) return {};
        if (!data.name?.trim()) throw new Error('Enter an account name.');
        const a = {
          ...data,
          name: data.name.trim(),
          id: data.id || id(),
          balance: money(data.balance ?? 0),
          createdAt: now(),
        };
        const opening = a.balance
          ? {
              id: id(),
              type: a.balance > 0 ? 'income' : 'expense',
              kind: 'opening',
              amount: Math.abs(a.balance),
              categoryId: a.balance > 0 ? 'salary' : 'utilities',
              accountId: a.id,
              date: localDateString(),
              description: 'Opening balance',
              createdAt: now(),
            }
          : null;
        return {
          accounts: [...s.accounts, a],
          transactions: opening ? [opening, ...s.transactions] : s.transactions,
        };
      }),
    addMoneyToAccount: (
      accountId,
      amount,
      incomeSource = 'salary',
      note = ''
    ) =>
      get().addTransaction({
        type: 'income',
        amount,
        categoryId: incomeSource,
        accountId,
        date: localDateString(),
        description: note || 'Income received',
      }),
    updateAccount: (accountId, updates) =>
      commit((s) => {
        const a = requireAccount(s.accounts, accountId);
        if (!updates.name?.trim() && updates.name !== undefined)
          throw new Error('Enter an account name.');
        const next =
          updates.balance === undefined ? a.balance : money(updates.balance);
        const adjustments =
          next === a.balance
            ? s.adjustments
            : [
                ...s.adjustments,
                {
                  id: id(),
                  accountId,
                  previousBalance: a.balance,
                  newBalance: next,
                  reason: 'Account balance edited',
                  date: now(),
                },
              ];
        return {
          accounts: s.accounts.map((x) =>
            x.id === accountId
              ? { ...x, ...updates, id: accountId, balance: next }
              : x
          ),
          adjustments,
        };
      }),
    deleteAccount: (accountId) =>
      commit((s) => {
        requireAccount(s.accounts, accountId);
        if (
          s.transactions.some((t) => t.accountId === accountId) ||
          s.savingsGoals.some((g) => g.linkedAccountId === accountId) ||
          s.recurringBills.some((b) => b.accountId === accountId)
        )
          throw new Error(
            'This account has linked records. Keep it or move the records before deleting.'
          );
        return { accounts: s.accounts.filter((a) => a.id !== accountId) };
      }),
    adjustAccountBalance: (accountId, value, reason) =>
      commit((s) => {
        const a = requireAccount(s.accounts, accountId);
        const next = money(value);
        if (!reason?.trim())
          throw new Error('Enter a reason for this balance adjustment.');
        return {
          accounts: s.accounts.map((x) =>
            x.id === accountId ? { ...x, balance: next } : x
          ),
          adjustments: [
            ...s.adjustments,
            {
              id: id(),
              accountId,
              previousBalance: a.balance,
              newBalance: next,
              reason: reason.trim(),
              date: now(),
            },
          ],
        };
      }),
    transferBetweenAccounts: (fromId, toId, value) =>
      commit((s) => {
        if (fromId === toId) throw new Error('Choose two different accounts.');
        const amount = money(value, { positive: true });
        const source = requireAccount(s.accounts, fromId);
        requireAccount(s.accounts, toId);
        if (source.balance < amount)
          throw new Error('The source account has insufficient funds.');
        const operationId = id();
        const date = localDateString();
        const out = txn(s, {
          type: 'expense',
          kind: 'transfer',
          amount,
          accountId: fromId,
          categoryId: 'savings',
          date,
          description: 'Transfer out',
          operationId,
        });
        const incoming = txn(s, {
          type: 'income',
          kind: 'transfer',
          amount,
          accountId: toId,
          categoryId: 'investment',
          date,
          description: 'Transfer in',
          operationId,
        });
        return {
          accounts: balance(balance(s.accounts, fromId, -amount), toId, amount),
          transactions: [out, incoming, ...s.transactions],
        };
      }),
    addTransaction: (data) =>
      commit((s) => {
        if (data.id && s.transactions.some((t) => t.id === data.id)) return {};
        const t = txn(s, data);
        return {
          transactions: [t, ...s.transactions],
          accounts: balance(s.accounts, t.accountId, accountDelta(t)),
        };
      }),
    updateTransaction: (transactionId, updates) =>
      commit((s) => {
        const old = s.transactions.find((t) => t.id === transactionId);
        if (!old) throw new Error('Transaction no longer exists.');
        if (old.kind && !['income', 'expense', 'refund'].includes(old.kind))
          throw new Error(
            'Use the related account or savings action to change this internal movement.'
          );
        requireAccount(s.accounts, old.accountId);
        const t = txn(s, {
          ...old,
          ...updates,
          kind: updates.kind || updates.type || old.type,
          id: old.id,
        });
        return {
          transactions: s.transactions.map((x) =>
            x.id === transactionId ? t : x
          ),
          accounts: balance(
            balance(s.accounts, old.accountId, -accountDelta(old)),
            t.accountId,
            accountDelta(t)
          ),
        };
      }),
    deleteTransaction: (transactionId) =>
      commit((s) => {
        const t = s.transactions.find((x) => x.id === transactionId);
        if (!t) throw new Error('Transaction no longer exists.');
        if (t.kind && !['income', 'expense', 'refund'].includes(t.kind))
          throw new Error(
            'Internal movements cannot be deleted independently of their related balance.'
          );
        requireAccount(s.accounts, t.accountId);
        return {
          transactions: s.transactions.filter((x) => x.id !== transactionId),
          accounts: balance(s.accounts, t.accountId, -accountDelta(t)),
        };
      }),
    importTransactions: (rows) =>
      commit((s) => {
        if (!rows.length) throw new Error('No transactions to import.');
        const seen = new Set(s.transactions.map(transactionSignature));
        let accounts = s.accounts;
        const transactions = [];
        for (const data of rows) {
          const t = txn(s, data);
          const signature = transactionSignature(t);
          if (seen.has(signature))
            throw new Error(
              'Duplicate transaction. Import cancelled without changing balances.'
            );
          seen.add(signature);
          accounts = balance(accounts, t.accountId, accountDelta(t));
          transactions.push(t);
        }
        return { transactions: [...transactions, ...s.transactions], accounts };
      }),
    addCustomCategory: (type, name) =>
      commit((s) => {
        if (!['income', 'expense'].includes(type) || !name?.trim())
          throw new Error('Enter a category name.');
        const categoryId = name.trim().toLowerCase().replace(/\s+/g, '-');
        if (s.categories[type].some((c) => c.id === categoryId)) return {};
        return {
          categories: {
            ...s.categories,
            [type]: [
              ...s.categories[type],
              {
                id: categoryId,
                key: categoryId,
                label: name.trim(),
                custom: true,
                color: '#94A3B8',
              },
            ],
          },
        };
      }),
    addBudget: (data) =>
      commit((s) => {
        if (data.id && s.budgets.some((b) => b.id === data.id)) return {};
        if (!s.categories.expense.some((c) => c.id === data.categoryId))
          throw new Error('Choose an expense category.');
        if (s.budgets.some((b) => b.categoryId === data.categoryId))
          throw new Error(
            'This category already has a budget. Edit the existing budget.'
          );
        return {
          budgets: [
            ...s.budgets,
            {
              ...data,
              id: data.id || id(),
              period: data.period || 'monthly',
              limit: money(data.limit ?? data.amount, { positive: true }),
            },
          ],
        };
      }),
    updateBudget: (budgetId, updates) =>
      commit((s) => ({
        budgets: s.budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                ...updates,
                id: b.id,
                limit: money(updates.limit ?? updates.amount ?? b.limit, {
                  positive: true,
                }),
              }
            : b
        ),
      })),
    deleteBudget: (budgetId) =>
      commit((s) => ({ budgets: s.budgets.filter((b) => b.id !== budgetId) })),
    updateProfile: (updates) =>
      commit((s) => ({
        profile: {
          ...s.profile,
          ...updates,
          monthlySalary: money(
            updates.monthlySalary ?? s.profile.monthlySalary,
            { nonnegative: true }
          ),
        },
      })),
    updateSettings: (updates) =>
      commit((s) => ({ settings: { ...s.settings, ...updates } })),
    initializeOnboardingAccounts: (list = []) => {
      if (get().accounts.length) {
        set({ financialError: 'Existing accounts have been preserved.' });
        return false;
      }
      return commit((s) => {
        const accounts = (
          list.length
            ? list
            : [{ name: 'Cash Wallet', type: 'wallet', balance: 0 }]
        ).map((a) => {
          if (!a.name?.trim()) throw new Error('Enter an account name.');
          return {
            ...a,
            id: id(),
            name: a.name.trim(),
            balance: money(a.balance ?? 0),
            createdAt: now(),
          };
        });
        const transactions = accounts
          .filter((a) => a.balance !== 0)
          .map((a) => ({
            id: id(),
            type: a.balance > 0 ? 'income' : 'expense',
            kind: 'opening',
            amount: Math.abs(a.balance),
            categoryId: a.balance > 0 ? 'salary' : 'utilities',
            accountId: a.id,
            date: localDateString(),
            description: 'Opening balance',
            createdAt: now(),
          }));
        return { accounts, transactions: [...transactions, ...s.transactions] };
      });
    },
    completeOnboarding: () => commit({ onboardingComplete: true }),
    openSavingsModal: (editGoal = null) =>
      set({ savingsModal: { isOpen: true, editGoal } }),
    closeSavingsModal: () =>
      set({ savingsModal: { isOpen: false, editGoal: null } }),
    openDepositModal: (goal, mode = 'deposit') =>
      set({ depositModal: { isOpen: true, goal, mode } }),
    closeDepositModal: () =>
      set({ depositModal: { isOpen: false, goal: null, mode: 'deposit' } }),
    openCalculatorModal: (initialData = null) =>
      set({ calculatorModal: { isOpen: true, initialData } }),
    closeCalculatorModal: () =>
      set({ calculatorModal: { isOpen: false, initialData: null } }),
    addSavingsGoal: (data) =>
      commit((s) => {
        if (data.id && s.savingsGoals.some((g) => g.id === data.id)) return {};
        if (!data.name?.trim()) throw new Error('Enter a savings goal name.');
        const g = {
          ...goalAmounts(data),
          id: data.id || id(),
          status: 'active',
          createdAt: now(),
          history: [],
        };
        let accounts = s.accounts;
        let transactions = s.transactions;
        if (g.currentAmount > 0) {
          requireAccount(accounts, g.linkedAccountId);
          const t = txn(s, {
            type: 'expense',
            kind: 'savings',
            amount: g.currentAmount,
            categoryId: 'savings',
            accountId: g.linkedAccountId,
            date: localDateString(),
            description: `Initial allocation to ${g.name}`,
            savingsGoalId: g.id,
          });
          if (
            requireAccount(accounts, g.linkedAccountId).balance <
            g.currentAmount
          )
            throw new Error('Insufficient funds for the initial allocation.');
          accounts = balance(accounts, g.linkedAccountId, -g.currentAmount);
          transactions = [t, ...transactions];
          g.history = [
            {
              id: id(),
              type: 'deposit',
              amount: g.currentAmount,
              date: now(),
              note: 'Initial allocation',
            },
          ];
        }
        return { savingsGoals: [g, ...s.savingsGoals], accounts, transactions };
      }),
    updateSavingsGoal: (goalId, updates) =>
      commit((s) => {
        const old = s.savingsGoals.find((g) => g.id === goalId);
        if (!old) throw new Error('Savings goal no longer exists.');
        if (
          updates.currentAmount !== undefined &&
          money(updates.currentAmount) !== old.currentAmount
        )
          throw new Error('Use deposit or withdraw to change saved funds.');
        const g = goalAmounts({ ...old, ...updates, id: old.id });
        if (g.linkedAccountId) requireAccount(s.accounts, g.linkedAccountId);
        return {
          savingsGoals: s.savingsGoals.map((x) => (x.id === goalId ? g : x)),
        };
      }),
    deleteSavingsGoal: (goalId) =>
      commit((s) => {
        if (s.savingsGoals.find((g) => g.id === goalId)?.currentAmount > 0)
          throw new Error(
            'Withdraw the saved funds before deleting this goal.'
          );
        return { savingsGoals: s.savingsGoals.filter((g) => g.id !== goalId) };
      }),
    depositToSavingsGoal: (goalId, value, accountId, note = '') =>
      commit((s) => {
        const g = s.savingsGoals.find((x) => x.id === goalId);
        if (!g) throw new Error('Savings goal no longer exists.');
        const amount = money(value, { positive: true });
        const a = requireAccount(s.accounts, accountId);
        if (a.balance < amount)
          throw new Error('Insufficient funds for this deposit.');
        const t = txn(s, {
          type: 'expense',
          kind: 'savings',
          amount,
          categoryId: 'savings',
          accountId,
          date: localDateString(),
          description: note || `Deposit to ${g.name}`,
          savingsGoalId: goalId,
        });
        const currentAmount = addMoney(g.currentAmount, amount);
        const next = {
          ...g,
          currentAmount,
          status: currentAmount >= g.targetAmount ? 'completed' : 'active',
          history: [
            { id: id(), date: now(), amount, type: 'deposit', note },
            ...(g.history || []),
          ],
        };
        return {
          accounts: balance(s.accounts, accountId, -amount),
          transactions: [t, ...s.transactions],
          savingsGoals: s.savingsGoals.map((x) => (x.id === goalId ? next : x)),
        };
      }),
    withdrawFromSavingsGoal: (goalId, value, accountId, note = '') =>
      commit((s) => {
        const g = s.savingsGoals.find((x) => x.id === goalId);
        if (!g) throw new Error('Savings goal no longer exists.');
        const amount = money(value, { positive: true });
        requireAccount(s.accounts, accountId);
        if (amount > g.currentAmount)
          throw new Error('Withdrawal exceeds the saved amount.');
        const t = txn(s, {
          type: 'income',
          kind: 'savings',
          amount,
          categoryId: 'investment',
          accountId,
          date: localDateString(),
          description: note || `Withdrawal from ${g.name}`,
          savingsGoalId: goalId,
        });
        const next = {
          ...g,
          currentAmount: addMoney(g.currentAmount, -amount),
          status: 'active',
          history: [
            { id: id(), date: now(), amount, type: 'withdraw', note },
            ...(g.history || []),
          ],
        };
        return {
          accounts: balance(s.accounts, accountId, amount),
          transactions: [t, ...s.transactions],
          savingsGoals: s.savingsGoals.map((x) => (x.id === goalId ? next : x)),
        };
      }),
    addRecurringBill: (data) =>
      commit((s) => {
        if (data.id && s.recurringBills.some((b) => b.id === data.id))
          return {};
        const amount = money(data.amount, { positive: true });
        const dueDay = Number(data.dueDay);
        if (
          !data.name?.trim() ||
          !Number.isInteger(dueDay) ||
          dueDay < 1 ||
          dueDay > 31
        )
          throw new Error('Enter a bill name and due day from 1 to 31.');
        if (data.accountId) requireAccount(s.accounts, data.accountId);
        return {
          recurringBills: [
            {
              ...data,
              id: data.id || id(),
              amount,
              dueDay,
              paidMonths: [],
              unpaidMonths: [],
              createdAt: now(),
            },
            ...s.recurringBills,
          ],
        };
      }),
    updateRecurringBill: (billId, updates) =>
      commit((s) => {
        if (updates.accountId) requireAccount(s.accounts, updates.accountId);
        if (
          updates.dueDay !== undefined &&
          (!Number.isInteger(Number(updates.dueDay)) ||
            Number(updates.dueDay) < 1 ||
            Number(updates.dueDay) > 31)
        )
          throw new Error('Choose a due day from 1 to 31.');
        return {
          recurringBills: s.recurringBills.map((b) =>
            b.id === billId
              ? {
                  ...b,
                  ...updates,
                  id: b.id,
                  amount: money(updates.amount ?? b.amount, { positive: true }),
                }
              : b
          ),
        };
      }),
    deleteRecurringBill: (billId) =>
      commit((s) => ({
        recurringBills: s.recurringBills.filter((b) => b.id !== billId),
      })),
    payRecurringBill: (billId, { accountId, date, note, amount } = {}) =>
      commit((s) => {
        const b = s.recurringBills.find((x) => x.id === billId);
        if (!b) throw new Error('Bill no longer exists.');
        const payDate = localDateString(parseDate(date || localDateString()));
        const month = payDate.slice(0, 7);
        if (
          s.transactions.some(
            (t) =>
              t.recurringBillId === billId &&
              localDateString(t.date).slice(0, 7) === month
          )
        )
          throw new Error(
            'This bill already has a payment for that month. Edit its transaction instead.'
          );
        const t = txn(s, {
          type: 'expense',
          amount: amount ?? b.amount,
          accountId: accountId || b.accountId,
          categoryId: b.categoryId,
          date: payDate,
          description: note || `${b.name} (Recurring Payment)`,
          recurring: true,
          recurringBillId: billId,
        });
        return {
          accounts: balance(s.accounts, t.accountId, -t.amount),
          transactions: [t, ...s.transactions],
          recurringBills: s.recurringBills.map((x) =>
            x.id === billId
              ? {
                  ...x,
                  paidMonths: [...new Set([...(x.paidMonths || []), month])],
                  unpaidMonths: (x.unpaidMonths || []).filter(
                    (m) => m !== month
                  ),
                }
              : x
          ),
        };
      }),
    markRecurringBillPaid: (billId, month = localDateString().slice(0, 7)) =>
      commit((s) => ({
        recurringBills: s.recurringBills.map((b) =>
          b.id === billId
            ? {
                ...b,
                paidMonths: [...new Set([...(b.paidMonths || []), month])],
                unpaidMonths: (b.unpaidMonths || []).filter((m) => m !== month),
              }
            : b
        ),
      })),
    markRecurringBillUnpaid: (billId, month = localDateString().slice(0, 7)) =>
      commit((s) => ({
        recurringBills: s.recurringBills.map((b) =>
          b.id === billId
            ? {
                ...b,
                paidMonths: (b.paidMonths || []).filter((m) => m !== month),
                unpaidMonths: [...new Set([...(b.unpaidMonths || []), month])],
              }
            : b
        ),
      })),
    toggleRecurringBillPaid: (
      billId,
      month = localDateString().slice(0, 7)
    ) => {
      const b = get().recurringBills.find((x) => x.id === billId);
      return b?.paidMonths?.includes(month)
        ? get().markRecurringBillUnpaid(billId, month)
        : get().markRecurringBillPaid(billId, month);
    },
    startTour: () => set({ isTourOpen: true, tourStep: 0 }),
    endTour: () => {
      set({ isTourOpen: false });
      commit({ tourCompleted: true });
    },
    nextTourStep: () => set((s) => ({ tourStep: s.tourStep + 1 })),
    prevTourStep: () => set((s) => ({ tourStep: Math.max(0, s.tourStep - 1) })),
    setTourStep: (step) => set({ tourStep: step }),
    reviewLegacyTransaction: (transactionId, updates) =>
      commit((s) => {
        const t = s.transactions.find((x) => x.id === transactionId);
        if (!t) throw new Error('Record no longer exists.');
        requireAccount(s.accounts, updates.accountId ?? t.accountId);
        if (
          updates.kind &&
          ![
            'income',
            'expense',
            'opening',
            'savings',
            'transfer',
            'refund',
          ].includes(updates.kind)
        )
          throw new Error('Invalid classification.');
        if (
          (updates.kind === 'income' && t.type !== 'income') ||
          (updates.kind === 'expense' && t.type !== 'expense')
        )
          throw new Error(
            'Choose a classification matching the original money direction.'
          );
        if (updates.kind === 'refund' && t.type !== 'income')
          throw new Error('Only money received can be marked as a refund.');
        return {
          transactions: s.transactions.map((x) =>
            x.id === transactionId ? { ...x, ...updates } : x
          ),
          adjustments: [
            ...s.adjustments,
            {
              id: id(),
              accountId: updates.accountId || t.accountId,
              reason: 'Historical record reviewed; account balances unchanged',
              transactionId,
              date: now(),
            },
          ],
        };
      }),
    restoreBackup: (data) => {
      if (
        data.transactions.some(
          (t) =>
            !data.accounts.some((a) => a.id === t.accountId) &&
            !get().transactions.some(
              (old) =>
                old.id === t.id &&
                old.accountId === t.accountId &&
                old.amount === t.amount
            )
        )
      ) {
        set({
          financialError:
            'The backup has unknown account links. Restore matching accounts or review the records first.',
        });
        return false;
      }
      try {
        localStorage.setItem(
          `hisab-before-restore:${get().user.id}`,
          JSON.stringify(createBackup(get()))
        );
      } catch {
        set({
          financialError:
            'Could not preserve the current data. Export a backup before restoring.',
        });
        return false;
      }
      return commit(snapshot(data));
    },
    resetAll: () => {
      set({
        financialError:
          'Reset is unavailable while data preservation is being verified. Export a backup to keep your records.',
      });
      return false;
    },
    getTotalBalance: () =>
      get().accounts.reduce((sum, a) => addMoney(sum, a.balance), 0),
    getTotalSavings: () =>
      get().savingsGoals.reduce((sum, g) => addMoney(sum, g.currentAmount), 0),
    getTotalLockedFunds: () =>
      get()
        .savingsGoals.filter(
          (g) => g.isLocked || ['fdr', 'dps'].includes(g.type)
        )
        .reduce((sum, g) => addMoney(sum, g.currentAmount), 0),
    getSavingsGoalById: (goalId) =>
      get().savingsGoals.find((g) => g.id === goalId),
    getMonthlyTransactions: (year, month) =>
      get().transactions.filter((t) => {
        const d = parseDate(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    getMonthlyIncome: (year, month) =>
      get()
        .getMonthlyTransactions(year, month)
        .filter(isIncome)
        .reduce((sum, t) => addMoney(sum, t.amount), 0),
    getMonthlyExpense: (year, month) =>
      get()
        .getMonthlyTransactions(year, month)
        .filter(isExpense)
        .reduce((sum, t) => addMoney(sum, expenseAmount(t)), 0),
    getCategorySpending: (year, month) => {
      const spending = {};
      get()
        .getMonthlyTransactions(year, month)
        .filter(isExpense)
        .forEach((t) => {
          spending[t.categoryId] = addMoney(
            spending[t.categoryId] || 0,
            expenseAmount(t)
          );
        });
      return spending;
    },
    getAccountById: (accountId) =>
      get().accounts.find((a) => a.id === accountId),
    getCategoryById: (type, categoryId) =>
      (get().categories[type] || []).find((c) => c.id === categoryId),
  };
});
export default useStore;
