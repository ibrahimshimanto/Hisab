import { create } from 'zustand';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  uploadLocalDataToCloud,
  fetchCloudData,
  pushTransaction,
  pushAccount,
  pushAccounts,
  pushBudget,
  pushSavingsGoal,
  pushRecurringBill,
  pushProfile,
} from '../services/syncService.js';

const STORAGE_KEY = 'hisab-data';

const defaultAccounts = [
  { id: 'acc-bkash', name: 'bKash', type: 'mfs', balance: 5750 },
  { id: 'acc-bank', name: 'City Bank', type: 'bank', balance: 45000 },
  { id: 'acc-nagad', name: 'Nagad', type: 'mfs', balance: 2500 },
  { id: 'acc-wallet', name: 'Cash Wallet', type: 'wallet', balance: 3200 },
];

function consolidateAccounts(accounts = [], transactions = [], adjustments = []) {
  if (!Array.isArray(accounts) || accounts.length <= 1) {
    return { accounts, transactions, adjustments, hasDuplicates: false };
  }

  const consolidated = [];
  const idRemap = {};
  let hasDuplicates = false;

  for (const acc of accounts) {
    const normName = (acc.name || '').trim().toLowerCase();
    const existingIndex = consolidated.findIndex(
      (c) => (c.name || '').trim().toLowerCase() === normName
    );

    if (existingIndex >= 0) {
      hasDuplicates = true;
      const primary = consolidated[existingIndex];
      primary.balance = (Number(primary.balance) || 0) + (Number(acc.balance) || 0);
      idRemap[acc.id] = primary.id;
    } else {
      consolidated.push({ ...acc, balance: Number(acc.balance) || 0 });
    }
  }

  if (!hasDuplicates) {
    return { accounts, transactions, adjustments, hasDuplicates: false };
  }

  const remappedTransactions = (transactions || []).map((t) => {
    if (t.accountId && idRemap[t.accountId]) {
      return { ...t, accountId: idRemap[t.accountId] };
    }
    return t;
  });

  const remappedAdjustments = (adjustments || []).map((a) => {
    if (a.accountId && idRemap[a.accountId]) {
      return { ...a, accountId: idRemap[a.accountId] };
    }
    return a;
  });

  return {
    accounts: consolidated,
    transactions: remappedTransactions,
    adjustments: remappedAdjustments,
    hasDuplicates: true,
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data) {
      if (!data.accounts || data.accounts.length === 0) {
        data.accounts = defaultAccounts;
      } else {
        const { accounts, transactions, adjustments, hasDuplicates } = consolidateAccounts(
          data.accounts,
          data.transactions,
          data.adjustments
        );
        data.accounts = accounts;
        data.transactions = transactions;
        data.adjustments = adjustments;
        if (hasDuplicates) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      }
      if (!data.recurringBills || !Array.isArray(data.recurringBills)) {
        data.recurringBills = defaultRecurringBills;
      }
    }
    return data;
  } catch {
    return null;
  }
}

function saveToStorage(state) {
  try {
    const data = {
      accounts: state.accounts,
      transactions: state.transactions,
      budgets: state.budgets,
      categories: state.categories,
      adjustments: state.adjustments,
      profile: state.profile,
      settings: state.settings,
      financialMode: state.financialMode,
      modeSettings: state.modeSettings,
      savingsGoals: state.savingsGoals,
      recurringBills: state.recurringBills,
      tourCompleted: state.tourCompleted,
      onboardingComplete: state.onboardingComplete,
      sidebarCollapsed: state.sidebarCollapsed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

const defaultCategories = {
  expense: [
    { id: 'rent', key: 'rent', color: '#F87171' },
    { id: 'food', key: 'food', color: '#FB923C' },
    { id: 'transport', key: 'transport', color: '#FBBF24' },
    { id: 'utilities', key: 'utilities', color: '#34D399' },
    { id: 'entertainment', key: 'entertainment', color: '#A78BFA' },
    { id: 'health', key: 'health', color: '#F472B6' },
    { id: 'education', key: 'education', color: '#60A5FA' },
    { id: 'shopping', key: 'shopping', color: '#E879F9' },
    { id: 'subscriptions', key: 'subscriptions', color: '#818CF8' },
    { id: 'savings', key: 'savings', color: '#5ED21C' },
  ],
  income: [
    { id: 'salary', key: 'salary', color: '#4ADE80' },
    { id: 'freelance', key: 'freelance', color: '#22D3EE' },
    { id: 'business', key: 'business', color: '#2DD4BF' },
    { id: 'investment', key: 'investment', color: '#FCD34D' },
    { id: 'gift', key: 'gift', color: '#FB7185' },
  ],
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const CATEGORY_COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399', '#A78BFA',
  '#F472B6', '#60A5FA', '#E879F9', '#818CF8', '#4ADE80',
  '#22D3EE', '#2DD4BF', '#FCD34D', '#FB7185', '#94A3B8',
];

export const defaultModeSettings = {
  eco: { savingRate: 40, defaultSavingRate: 40, minRate: 30, maxRate: 75 },
  cruise: { savingRate: 20, defaultSavingRate: 20, minRate: 15, maxRate: 35 },
  racing: { savingRate: 5, defaultSavingRate: 5, minRate: 1, maxRate: 15 },
};

const defaultSavingsGoals = [
  {
    id: 'goal-dps-1',
    name: 'bKash Smart DPS 5K',
    type: 'dps',
    targetAmount: 120000,
    currentAmount: 45000,
    monthlyContribution: 5000,
    interestRate: 7.0,
    startDate: '2024-01-15',
    targetDate: '2026-12-31',
    isLocked: true,
    linkedAccountId: '',
    status: 'active',
    history: [
      { id: 'h-1', date: '2024-01-15', amount: 5000, type: 'deposit', note: 'Initial installment' },
      { id: 'h-2', date: '2024-02-15', amount: 5000, type: 'deposit', note: 'Feb auto-debit' },
      { id: 'h-3', date: '2024-03-15', amount: 5000, type: 'deposit', note: 'Mar installment' }
    ]
  },
  {
    id: 'goal-fdr-1',
    name: 'City Bank High-Yield FDR',
    type: 'fdr',
    targetAmount: 100000,
    currentAmount: 100000,
    monthlyContribution: 0,
    interestRate: 8.5,
    startDate: '2024-06-01',
    targetDate: '2025-06-01',
    isLocked: true,
    linkedAccountId: '',
    status: 'active',
    history: [
      { id: 'h-4', date: '2024-06-01', amount: 100000, type: 'deposit', note: 'Fixed Deposit creation' }
    ]
  },
  {
    id: 'goal-emergency-1',
    name: '6-Month Emergency Reserve',
    type: 'emergency',
    targetAmount: 150000,
    currentAmount: 90000,
    monthlyContribution: 10000,
    interestRate: 4.5,
    startDate: '2024-03-01',
    targetDate: '2025-09-01',
    isLocked: false,
    linkedAccountId: '',
    status: 'active',
    history: [
      { id: 'h-5', date: '2024-03-01', amount: 90000, type: 'deposit', note: 'Liquid reserve allocation' }
    ]
  },
  {
    id: 'goal-macbook-1',
    name: 'MacBook Pro M3 Max',
    type: 'purchase',
    targetAmount: 240000,
    currentAmount: 160000,
    monthlyContribution: 20000,
    interestRate: 0,
    startDate: '2024-04-01',
    targetDate: '2024-12-25',
    isLocked: false,
    linkedAccountId: '',
    status: 'active',
    history: [
      { id: 'h-6', date: '2024-04-01', amount: 160000, type: 'deposit', note: 'Tech purchase fund seed' }
    ]
  }
];

export const defaultRecurringBills = [
  {
    id: 'rec-rent',
    name: 'Home Rent',
    amount: 22000,
    dueDay: 5,
    categoryId: 'rent',
    icon: '🏠',
    accountId: 'acc-bank',
    paidMonths: [],
  },
  {
    id: 'rec-internet',
    name: 'Broadband Internet',
    amount: 1200,
    dueDay: 10,
    categoryId: 'utilities',
    icon: '🌐',
    accountId: 'acc-bkash',
    paidMonths: [],
  },
  {
    id: 'rec-electricity',
    name: 'Electricity Bill',
    amount: 3200,
    dueDay: 15,
    categoryId: 'utilities',
    icon: '⚡',
    accountId: 'acc-bkash',
    paidMonths: [],
  },
  {
    id: 'rec-netflix',
    name: 'Netflix Subscription',
    amount: 1450,
    dueDay: 22,
    categoryId: 'subscriptions',
    icon: '🎬',
    accountId: 'acc-bank',
    paidMonths: [],
  },
];

const initialState = {
  accounts: defaultAccounts,
  transactions: [],
  budgets: [],
  adjustments: [],
  categories: defaultCategories,
  savingsGoals: defaultSavingsGoals,
  recurringBills: defaultRecurringBills,
  savingsModal: { isOpen: false, editGoal: null },
  depositModal: { isOpen: false, goal: null, mode: 'deposit' },
  calculatorModal: { isOpen: false, initialData: null },
  isTourOpen: false,
  tourStep: 0,
  tourCompleted: false,
  profile: {
    name: '',
    monthlySalary: 0,
    avatar: null,
  },
  settings: {
    theme: 'light',
    currency: 'BDT',
  },
  financialMode: 'cruise', // 'eco' | 'cruise' | 'racing'
  modeSettings: defaultModeSettings,
  onboardingComplete: false,
  sidebarCollapsed: false,
  user: null,
  session: null,
  isAuthLoading: true,
  syncStatus: 'synced', // 'synced' | 'syncing' | 'offline' | 'error'
  lastSyncedAt: new Date().toISOString(),
  authModalOpen: false,
};

function backgroundSync(actionType, data, extra = {}) {
  try {
    const user = useStore?.getState?.()?.user;
    const userId = user?.id || null;

    if (actionType === 'transaction') {
      pushTransaction(userId, data, extra.action || 'upsert');
    } else if (actionType === 'account') {
      pushAccount(userId, data, extra.action || 'upsert');
    } else if (actionType === 'accounts') {
      pushAccounts(userId, data);
    } else if (actionType === 'budget') {
      pushBudget(userId, data, extra.action || 'upsert');
    } else if (actionType === 'savingsGoal') {
      pushSavingsGoal(userId, data, extra.action || 'upsert');
    } else if (actionType === 'recurringBill') {
      pushRecurringBill(userId, data, extra.action || 'upsert');
    } else if (actionType === 'profile') {
      pushProfile(userId, data);
    }
  } catch (err) {
    console.warn('backgroundSync warning:', err);
  }
}

const saved = loadFromStorage();

const useStore = create((set, get) => ({
  ...(saved ? { ...initialState, ...saved } : initialState),

  // ---- Cloud Sync & Auth State (Always Online & Synced) ----
  user: null,
  session: null,
  isAuthLoading: true,
  syncStatus: 'synced',
  lastSyncedAt: new Date().toISOString(),
  authModalOpen: false,

  setAuthModalOpen: (open) => set({ authModalOpen: Boolean(open) }),
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  initAuth: async () => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      set({ syncStatus: 'synced', isAuthLoading: false });
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.warn('getSession warning:', error);

      const currentUser = session?.user || null;
      set({
        user: currentUser,
        session: session || null,
        syncStatus: 'syncing',
        isAuthLoading: false,
      });

      // Automatically sync and pull from cloud on startup
      const cloudResult = await fetchCloudData(currentUser?.id || null);
      if (cloudResult.success) {
        const hasCloudData =
          (cloudResult.data.transactions?.length > 0) ||
          (cloudResult.data.accounts?.length > 0) ||
          (cloudResult.data.savingsGoals?.length > 0) ||
          (cloudResult.data.budgets?.length > 0) ||
          (cloudResult.data.recurringBills?.length > 0);

        if (hasCloudData) {
          get().hydrateFromCloud(cloudResult.data);
          set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
        } else {
          // If cloud is fresh/empty, upload current store state to cloud
          await uploadLocalDataToCloud(currentUser?.id || null, get());
          set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
        }
      } else {
        set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
      }

      // Handle user OAuth sign-ins / sign-outs
      supabase.auth.onAuthStateChange(async (event, currentSession) => {
        const authUser = currentSession?.user || null;
        if (event === 'SIGNED_IN' && authUser) {
          set({ user: authUser, session: currentSession, syncStatus: 'syncing' });
          const userCloudData = await fetchCloudData(authUser.id);
          if (
            userCloudData.success &&
            (userCloudData.data.transactions?.length > 0 ||
              userCloudData.data.accounts?.length > 0 ||
              userCloudData.data.savingsGoals?.length > 0)
          ) {
            get().hydrateFromCloud(userCloudData.data);
          } else {
            await uploadLocalDataToCloud(authUser.id, get());
          }
          set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, syncStatus: 'synced' });
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          set({ user: currentSession.user, session: currentSession });
        }
      });
    } catch (err) {
      console.warn('initAuth warning:', err);
      set({ syncStatus: 'synced', isAuthLoading: false });
    }
  },

  hydrateFromCloud: (cloudData) => {
    set((state) => {
      const newState = {
        ...state,
        profile: {
          ...state.profile,
          ...(cloudData.profile?.name ? { name: cloudData.profile.name } : {}),
          ...(cloudData.profile?.monthlySalary !== undefined ? { monthlySalary: cloudData.profile.monthlySalary } : {}),
        },
        settings: {
          ...state.settings,
          ...(cloudData.settings?.theme ? { theme: cloudData.settings.theme } : {}),
          ...(cloudData.settings?.currency ? { currency: cloudData.settings.currency } : {}),
        },
        financialMode: cloudData.financialMode || state.financialMode,
        modeSettings: cloudData.modeSettings || state.modeSettings,
        accounts: cloudData.accounts?.length > 0 ? cloudData.accounts : state.accounts,
        transactions: cloudData.transactions?.length > 0 ? cloudData.transactions : state.transactions,
        budgets: cloudData.budgets?.length > 0 ? cloudData.budgets : state.budgets,
        savingsGoals: cloudData.savingsGoals?.length > 0 ? cloudData.savingsGoals : state.savingsGoals,
        recurringBills: cloudData.recurringBills?.length > 0 ? cloudData.recurringBills : state.recurringBills,
        onboardingComplete: cloudData.onboardingComplete !== undefined
          ? cloudData.onboardingComplete
          : (cloudData.accounts?.length > 0 ? true : state.onboardingComplete),
      };
      setTimeout(() => saveToStorage(get()), 0);
      return newState;
    });
  },

  syncToCloud: async () => {
    const user = get().user;
    set({ syncStatus: 'syncing' });
    const res = await uploadLocalDataToCloud(user?.id || null, get());
    if (res.success) {
      set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
    } else {
      set({ syncStatus: 'error' });
    }
  },

  syncFromCloud: async () => {
    const user = get().user;
    set({ syncStatus: 'syncing' });
    const res = await fetchCloudData(user?.id || null);
    if (res.success) {
      get().hydrateFromCloud(res.data);
      set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
    } else {
      set({ syncStatus: 'error' });
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    set({ user: null, session: null, syncStatus: 'synced' });
  },


  sidebarCollapsed: saved?.sidebarCollapsed ?? false,
  toggleSidebar: () => set((state) => {
    const next = !state.sidebarCollapsed;
    setTimeout(() => saveToStorage(get()), 0);
    return { sidebarCollapsed: next };
  }),
  setSidebarCollapsed: (val) => set(() => {
    setTimeout(() => saveToStorage(get()), 0);
    return { sidebarCollapsed: val };
  }),

  // ---- Voice Assistant Modal ----
  voiceModal: { isOpen: false },
  openVoiceModal: () => set({ voiceModal: { isOpen: true } }),
  closeVoiceModal: () => set({ voiceModal: { isOpen: false } }),

  // ---- Financial Driving Modes ----
  financialMode: saved?.financialMode || 'cruise',
  modeSettings: saved?.modeSettings
    ? {
        eco: { ...defaultModeSettings.eco, ...saved.modeSettings.eco },
        cruise: { ...defaultModeSettings.cruise, ...saved.modeSettings.cruise },
        racing: { ...defaultModeSettings.racing, ...saved.modeSettings.racing },
      }
    : defaultModeSettings,

  setFinancialMode: (mode) => {
    set({ financialMode: mode });
    setTimeout(() => saveToStorage(get()), 0);
  },

  updateModeTarget: (mode, savingRate) => {
    set((state) => {
      const current = state.modeSettings[mode] || defaultModeSettings[mode];
      const clampedRate = Math.min(current.maxRate, Math.max(current.minRate, Number(savingRate)));
      const nextSettings = {
        ...state.modeSettings,
        [mode]: {
          ...current,
          savingRate: clampedRate,
        },
      };
      setTimeout(() => saveToStorage(get()), 0);
      return { modeSettings: nextSettings };
    });
  },

  resetModeTarget: (mode) => {
    set((state) => {
      const current = state.modeSettings[mode] || defaultModeSettings[mode];
      const nextSettings = {
        ...state.modeSettings,
        [mode]: {
          ...current,
          savingRate: current.defaultSavingRate,
        },
      };
      setTimeout(() => saveToStorage(get()), 0);
      return { modeSettings: nextSettings };
    });
  },

  // ---- Voice Transaction Ingestion ----
  addTransactionFromVoice: (parsed) => {
    const { type, amount, categoryId, accountId, note } = parsed;
    const state = get();
    let targetAccount = state.accounts.find((a) => a.id === accountId);
    if (!targetAccount && state.accounts.length > 0) {
      targetAccount = state.accounts[0];
    }

    if (type === 'adjust' && targetAccount) {
      state.adjustBalance(targetAccount.id, Number(amount), note || 'Voice balance adjustment');
      return { success: true, type: 'adjust', amount: Number(amount), accountName: targetAccount.name };
    }

    const newTxn = {
      type: type || 'expense',
      amount: Number(amount),
      categoryId: categoryId || (type === 'income' ? 'salary' : 'food'),
      accountId: targetAccount ? targetAccount.id : '',
      date: new Date().toISOString(),
      note: note || (type === 'income' ? 'Voice logged income' : 'Voice logged expense'),
    };

    state.addTransaction(newTxn);
    return {
      success: true,
      type: newTxn.type,
      amount: newTxn.amount,
      categoryId: newTxn.categoryId,
      accountName: targetAccount?.name || '',
    };
  },

  quickAddModal: { isOpen: false, type: 'expense' },
  openQuickAdd: (type = 'expense') => set({ quickAddModal: { isOpen: true, type } }),
  closeQuickAdd: () => set({ quickAddModal: { isOpen: false, type: 'expense' } }),

  // ---- Accounts ----
  addAccount: (account) => {
    set((state) => {
      const normName = (account.name || '').trim().toLowerCase();
      const existing = state.accounts.find(
        (a) => (a.name || '').trim().toLowerCase() === normName
      );

      const numBalance = parseFloat(account.balance) || 0;
      const incomeSource = account.incomeSource || 'salary';

      if (existing) {
        // Auto-update existing account balance, DO NOT create another row!
        const updatedAccounts = state.accounts.map((a) =>
          a.id === existing.id
            ? { ...a, balance: (a.balance || 0) + numBalance }
            : a
        );

        let updatedTransactions = state.transactions;
        let updatedAdjustments = state.adjustments;

        if (numBalance > 0) {
          const newTxn = {
            id: generateId(),
            type: 'income',
            amount: numBalance,
            categoryId: incomeSource,
            accountId: existing.id,
            date: new Date().toISOString(),
            note: account.note || `Added balance to ${existing.name}`,
          };
          updatedTransactions = [newTxn, ...state.transactions];

          const adjustment = {
            id: generateId(),
            accountId: existing.id,
            previousBalance: existing.balance || 0,
            newBalance: (existing.balance || 0) + numBalance,
            reason: account.note ? `${account.note} (${incomeSource})` : `Added balance via ${incomeSource}`,
            date: new Date().toISOString(),
          };
          updatedAdjustments = [...state.adjustments, adjustment];
        }

        const newState = {
          accounts: updatedAccounts,
          transactions: updatedTransactions,
          adjustments: updatedAdjustments,
        };
        setTimeout(() => saveToStorage(get()), 0);
        backgroundSync('accounts', updatedAccounts);
        if (numBalance > 0) backgroundSync('transaction', newTxn);
        return newState;
      }

      // If new account
      const newId = generateId();
      const newAcc = {
        ...account,
        id: newId,
        balance: numBalance,
        createdAt: new Date().toISOString(),
      };

      let updatedTransactions = state.transactions;
      let newTxn = null;
      if (numBalance > 0) {
        newTxn = {
          id: generateId(),
          type: 'income',
          amount: numBalance,
          categoryId: incomeSource,
          accountId: newId,
          date: new Date().toISOString(),
          note: account.note || `Initial deposit for ${account.name}`,
        };
        updatedTransactions = [newTxn, ...state.transactions];
      }

      const newState = {
        accounts: [...state.accounts, newAcc],
        transactions: updatedTransactions,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('account', newAcc);
      if (newTxn) backgroundSync('transaction', newTxn);
      return newState;
    });
  },

  addMoneyToAccount: (accountId, amount, incomeSource = 'salary', note = '') => {
    const numAmount = Math.max(0, parseFloat(amount) || 0);
    if (!numAmount) return;
    set((state) => {
      const acc = state.accounts.find((a) => a.id === accountId);
      if (!acc) return {};
      const updatedAccounts = state.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: (a.balance || 0) + numAmount } : a
      );
      const newTxn = {
        id: generateId(),
        type: 'income',
        amount: numAmount,
        categoryId: incomeSource || 'salary',
        accountId: acc.id,
        date: new Date().toISOString(),
        note: note || `Added balance to ${acc.name}`,
      };
      const adjustment = {
        id: generateId(),
        accountId: acc.id,
        previousBalance: acc.balance || 0,
        newBalance: (acc.balance || 0) + numAmount,
        reason: note ? `${note} (${incomeSource})` : `Added balance via ${incomeSource}`,
        date: new Date().toISOString(),
      };
      const newState = {
        accounts: updatedAccounts,
        transactions: [newTxn, ...state.transactions],
        adjustments: [...state.adjustments, adjustment],
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('accounts', updatedAccounts);
      backgroundSync('transaction', newTxn);
      return newState;
    });
  },

  updateAccount: (id, updates) => {
    set((state) => {
      const updatedAccounts = state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a));
      const newState = {
        accounts: updatedAccounts,
      };
      setTimeout(() => saveToStorage(get()), 0);
      const updatedAcc = updatedAccounts.find((a) => a.id === id);
      if (updatedAcc) backgroundSync('account', updatedAcc);
      return newState;
    });
  },

  deleteAccount: (id) => {
    set((state) => {
      const newState = {
        accounts: state.accounts.filter((a) => a.id !== id),
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('account', { id }, { action: 'delete' });
      return newState;
    });
  },

  adjustAccountBalance: (accountId, newBalance, reason) => {
    set((state) => {
      const account = state.accounts.find((a) => a.id === accountId);
      if (!account) return {};

      const adjustment = {
        id: generateId(),
        accountId,
        previousBalance: account.balance,
        newBalance,
        reason: reason || '',
        date: new Date().toISOString(),
      };

      const updatedAccounts = state.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: newBalance } : a
      );

      const newState = {
        accounts: updatedAccounts,
        adjustments: [...state.adjustments, adjustment],
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('accounts', updatedAccounts);
      return newState;
    });
  },

  transferBetweenAccounts: (fromId, toId, amount) => {
    set((state) => {
      const updatedAccounts = state.accounts.map((a) => {
        if (a.id === fromId) return { ...a, balance: a.balance - amount };
        if (a.id === toId) return { ...a, balance: a.balance + amount };
        return a;
      });
      const newState = {
        accounts: updatedAccounts,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('accounts', updatedAccounts);
      return newState;
    });
  },

  // ---- Transactions ----
  addTransaction: (transaction) => {
    set((state) => {
      const newTransaction = {
        ...transaction,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      // Update account balance
      const accounts = state.accounts.map((a) => {
        if (a.id === transaction.accountId) {
          const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
          return { ...a, balance: a.balance + delta };
        }
        return a;
      });

      const newState = {
        transactions: [newTransaction, ...state.transactions],
        accounts,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('transaction', newTransaction);
      backgroundSync('accounts', accounts);
      return newState;
    });
  },

  updateTransaction: (id, updates) => {
    set((state) => {
      const oldTransaction = state.transactions.find((t) => t.id === id);
      if (!oldTransaction) return {};

      // Reverse the old transaction's effect on account balance
      let accounts = state.accounts.map((a) => {
        if (a.id === oldTransaction.accountId) {
          const reverseDelta = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
          return { ...a, balance: a.balance + reverseDelta };
        }
        return a;
      });

      const newTransaction = { ...oldTransaction, ...updates };

      // Apply the new transaction's effect on account balance
      accounts = accounts.map((a) => {
        if (a.id === newTransaction.accountId) {
          const delta = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
          return { ...a, balance: a.balance + delta };
        }
        return a;
      });

      const newState = {
        transactions: state.transactions.map((t) => (t.id === id ? newTransaction : t)),
        accounts,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('transaction', newTransaction);
      backgroundSync('accounts', accounts);
      return newState;
    });
  },

  deleteTransaction: (id) => {
    set((state) => {
      const transaction = state.transactions.find((t) => t.id === id);
      if (!transaction) return {};

      // Reverse the transaction's effect on account balance
      const accounts = state.accounts.map((a) => {
        if (a.id === transaction.accountId) {
          const reverseDelta = transaction.type === 'income' ? -transaction.amount : transaction.amount;
          return { ...a, balance: a.balance + reverseDelta };
        }
        return a;
      });

      const newState = {
        transactions: state.transactions.filter((t) => t.id !== id),
        accounts,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('transaction', { id }, { action: 'delete' });
      backgroundSync('accounts', accounts);
      return newState;
    });
  },

  importTransactions: (transactions) => {
    set((state) => {
      const newTransactions = transactions.map((t) => ({
        ...t,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }));
      const newState = {
        transactions: [...newTransactions, ...state.transactions],
      };
      setTimeout(() => saveToStorage(get()), 0);
      if (newTransactions.length > 0) {
        newTransactions.forEach((t) => backgroundSync('transaction', t));
      }
      return newState;
    });
  },

  // ---- Custom Categories ----
  addCustomCategory: (type, name) => {
    set((state) => {
      const existing = state.categories[type] || [];
      if (existing.some((c) => c.id === name.toLowerCase().replace(/\s+/g, '-'))) {
        return {};
      }
      const colorIndex = (existing.length) % CATEGORY_COLORS.length;
      const newCategory = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        key: name.toLowerCase().replace(/\s+/g, '-'),
        label: name,
        custom: true,
        color: CATEGORY_COLORS[colorIndex],
      };
      const newState = {
        categories: {
          ...state.categories,
          [type]: [...existing, newCategory],
        },
      };
      setTimeout(() => saveToStorage(get()), 0);
      return newState;
    });
  },

  // ---- Budgets ----
  addBudget: (budget) => {
    set((state) => {
      const newBudget = { ...budget, id: generateId() };
      const newState = {
        budgets: [...state.budgets, newBudget],
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('budget', newBudget);
      return newState;
    });
  },

  updateBudget: (id, updates) => {
    set((state) => {
      const updatedBudgets = state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b));
      const newState = {
        budgets: updatedBudgets,
      };
      setTimeout(() => saveToStorage(get()), 0);
      const updatedB = updatedBudgets.find((b) => b.id === id);
      if (updatedB) backgroundSync('budget', updatedB);
      return newState;
    });
  },

  deleteBudget: (id) => {
    set((state) => {
      const newState = {
        budgets: state.budgets.filter((b) => b.id !== id),
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('budget', { id }, { action: 'delete' });
      return newState;
    });
  },

  // ---- Profile ----
  updateProfile: (updates) => {
    set((state) => {
      const newState = {
        profile: { ...state.profile, ...updates },
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('profile', {
        full_name: updates.name !== undefined ? updates.name : state.profile.name,
        monthly_salary: updates.monthlySalary !== undefined ? updates.monthlySalary : state.profile.monthlySalary,
        avatar_url: updates.avatar !== undefined ? updates.avatar : state.profile.avatar,
      });
      return newState;
    });
  },

  // ---- Settings ----
  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      if (updates.theme) {
        document.documentElement.setAttribute('data-theme', updates.theme);
      }
      const newState = { settings: newSettings };
      setTimeout(() => saveToStorage(get()), 0);
      if (updates.theme || updates.currency) {
        backgroundSync('profile', {
          theme: newSettings.theme,
          currency: newSettings.currency,
        });
      }
      return newState;
    });
  },

  // ---- Onboarding ----
  initializeOnboardingAccounts: (accountsList = []) => {
    let createdAccounts = [];
    let initialTxns = [];

    if (Array.isArray(accountsList) && accountsList.length > 0) {
      createdAccounts = accountsList.map((acc) => ({
        id: generateId(),
        name: acc.name.trim(),
        type: acc.type || 'mfs',
        balance: parseFloat(acc.balance) || 0,
        createdAt: new Date().toISOString(),
      }));

      initialTxns = createdAccounts
        .filter((acc) => acc.balance > 0)
        .map((acc) => ({
          id: generateId(),
          type: 'income',
          amount: acc.balance,
          categoryId: 'salary',
          accountId: acc.id,
          date: new Date().toISOString(),
          note: `Starting balance for ${acc.name}`,
        }));
    } else {
      // Skipped / add later: provide single fresh Cash Wallet (৳0) with clean transactions
      createdAccounts = [
        {
          id: generateId(),
          name: 'Cash Wallet',
          type: 'wallet',
          balance: 0,
          createdAt: new Date().toISOString(),
        },
      ];
      initialTxns = [];
    }

    set({
      accounts: createdAccounts,
      transactions: initialTxns,
      adjustments: [],
    });

    setTimeout(() => saveToStorage(get()), 0);
    backgroundSync('accounts', createdAccounts);
    if (initialTxns.length > 0) {
      initialTxns.forEach((txn) => backgroundSync('transaction', txn));
    }
  },

  completeOnboarding: () => {
    set({ onboardingComplete: true });
    setTimeout(() => saveToStorage(get()), 0);
    const user = get().user;
    if (user?.id) {
      backgroundSync('profile', { onboarding_complete: true });
    }
  },

  // ---- Savings Goals & Locked Funds (Phase 1d) ----
  openSavingsModal: (editGoal = null) => set({ savingsModal: { isOpen: true, editGoal } }),
  closeSavingsModal: () => set({ savingsModal: { isOpen: false, editGoal: null } }),

  openDepositModal: (goal, mode = 'deposit') => set({ depositModal: { isOpen: true, goal, mode } }),
  closeDepositModal: () => set({ depositModal: { isOpen: false, goal: null, mode: 'deposit' } }),

  openCalculatorModal: (initialData = null) => set({ calculatorModal: { isOpen: true, initialData } }),
  closeCalculatorModal: () => set({ calculatorModal: { isOpen: false, initialData: null } }),

  addSavingsGoal: (goalData) => {
    set((state) => {
      const newGoal = {
        ...goalData,
        id: generateId(),
        currentAmount: Number(goalData.currentAmount || 0),
        targetAmount: Number(goalData.targetAmount || 0),
        monthlyContribution: Number(goalData.monthlyContribution || 0),
        interestRate: Number(goalData.interestRate || 0),
        status: 'active',
        createdAt: new Date().toISOString(),
        history: Number(goalData.currentAmount) > 0 ? [
          { id: generateId(), date: new Date().toISOString(), amount: Number(goalData.currentAmount), type: 'deposit', note: 'Initial allocation' }
        ] : [],
      };

      let accounts = state.accounts;
      if (goalData.linkedAccountId && Number(goalData.currentAmount) > 0) {
        accounts = state.accounts.map((a) => {
          if (a.id === goalData.linkedAccountId) {
            return { ...a, balance: a.balance - Number(goalData.currentAmount) };
          }
          return a;
        });
      }

      const newState = {
        savingsGoals: [newGoal, ...state.savingsGoals],
        accounts,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('savingsGoal', newGoal);
      if (goalData.linkedAccountId && Number(goalData.currentAmount) > 0) {
        backgroundSync('accounts', accounts);
      }
      return newState;
    });
  },

  updateSavingsGoal: (id, updates) => {
    set((state) => {
      const updatedGoals = state.savingsGoals.map((g) => (g.id === id ? { ...g, ...updates } : g));
      const newState = {
        savingsGoals: updatedGoals,
      };
      setTimeout(() => saveToStorage(get()), 0);
      const updatedG = updatedGoals.find((g) => g.id === id);
      if (updatedG) backgroundSync('savingsGoal', updatedG);
      return newState;
    });
  },

  deleteSavingsGoal: (id) => {
    set((state) => {
      const newState = {
        savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('savingsGoal', { id }, { action: 'delete' });
      return newState;
    });
  },

  depositToSavingsGoal: (id, amount, sourceAccountId, note = '') => {
    set((state) => {
      const goal = state.savingsGoals.find((g) => g.id === id);
      if (!goal) return {};
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) return {};

      let accounts = state.accounts;
      let newTransactions = state.transactions;

      if (sourceAccountId) {
        accounts = state.accounts.map((a) => {
          if (a.id === sourceAccountId) {
            return { ...a, balance: a.balance - numAmount };
          }
          return a;
        });

        newTransactions = [
          {
            id: generateId(),
            type: 'expense',
            amount: numAmount,
            categoryId: 'savings',
            accountId: sourceAccountId,
            date: new Date().toISOString(),
            note: note || `Deposit to ${goal.name}`,
            createdAt: new Date().toISOString(),
          },
          ...state.transactions,
        ];
      }

      const newHistoryItem = {
        id: generateId(),
        date: new Date().toISOString(),
        amount: numAmount,
        type: 'deposit',
        note: note || 'Contribution installment',
      };

      const newCurrentAmount = goal.currentAmount + numAmount;
      const isCompleted = newCurrentAmount >= goal.targetAmount;

      const updatedGoal = {
        ...goal,
        currentAmount: newCurrentAmount,
        status: isCompleted ? 'completed' : goal.status,
        history: [newHistoryItem, ...(goal.history || [])],
      };

      const newState = {
        savingsGoals: state.savingsGoals.map((g) => (g.id === id ? updatedGoal : g)),
        accounts,
        transactions: newTransactions,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('savingsGoal', updatedGoal);
      if (sourceAccountId) {
        backgroundSync('accounts', accounts);
        if (newTransactions[0]) backgroundSync('transaction', newTransactions[0]);
      }
      return newState;
    });
  },

  withdrawFromSavingsGoal: (id, amount, destinationAccountId, note = '') => {
    set((state) => {
      const goal = state.savingsGoals.find((g) => g.id === id);
      if (!goal) return {};
      const numAmount = Math.min(Number(amount), goal.currentAmount);
      if (isNaN(numAmount) || numAmount <= 0) return {};

      let accounts = state.accounts;
      let newTransactions = state.transactions;

      if (destinationAccountId) {
        accounts = state.accounts.map((a) => {
          if (a.id === destinationAccountId) {
            return { ...a, balance: a.balance + numAmount };
          }
          return a;
        });

        newTransactions = [
          {
            id: generateId(),
            type: 'income',
            amount: numAmount,
            categoryId: 'investment',
            accountId: destinationAccountId,
            date: new Date().toISOString(),
            note: note || `Withdrawal from ${goal.name}`,
            createdAt: new Date().toISOString(),
          },
          ...state.transactions,
        ];
      }

      const newHistoryItem = {
        id: generateId(),
        date: new Date().toISOString(),
        amount: numAmount,
        type: 'withdraw',
        note: note || 'Fund withdrawal',
      };

      const newCurrentAmount = Math.max(0, goal.currentAmount - numAmount);

      const updatedGoal = {
        ...goal,
        currentAmount: newCurrentAmount,
        status: newCurrentAmount === 0 ? 'matured' : goal.status,
        history: [newHistoryItem, ...(goal.history || [])],
      };

      const newState = {
        savingsGoals: state.savingsGoals.map((g) => (g.id === id ? updatedGoal : g)),
        accounts,
        transactions: newTransactions,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('savingsGoal', updatedGoal);
      if (destinationAccountId) {
        backgroundSync('accounts', accounts);
        if (newTransactions[0]) backgroundSync('transaction', newTransactions[0]);
      }
      return newState;
    });
  },

  // ---- Recurring Bills & Monthly Subscriptions ----
  addRecurringBill: (billData) => {
    set((state) => {
      const newBill = {
        id: `rec-${generateId()}`,
        name: (billData.name || '').trim(),
        amount: Number(billData.amount || 0),
        dueDay: Math.min(31, Math.max(1, Number(billData.dueDay || 1))),
        categoryId: billData.categoryId || 'utilities',
        accountId: billData.accountId || (state.accounts[0]?.id || ''),
        icon: billData.icon || '💳',
        paidMonths: billData.paidMonths || [],
        createdAt: new Date().toISOString(),
      };
      const newState = {
        recurringBills: [newBill, ...(state.recurringBills || [])],
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('recurringBill', newBill);
      return newState;
    });
  },

  updateRecurringBill: (id, updates) => {
    set((state) => {
      const updatedBills = (state.recurringBills || []).map((b) =>
        b.id === id
          ? {
              ...b,
              ...updates,
              amount: updates.amount !== undefined ? Number(updates.amount) : b.amount,
              dueDay: updates.dueDay !== undefined ? Math.min(31, Math.max(1, Number(updates.dueDay))) : b.dueDay,
            }
          : b
      );
      const newState = {
        recurringBills: updatedBills,
      };
      setTimeout(() => saveToStorage(get()), 0);
      const updatedB = updatedBills.find((b) => b.id === id);
      if (updatedB) backgroundSync('recurringBill', updatedB);
      return newState;
    });
  },

  deleteRecurringBill: (id) => {
    set((state) => {
      const newState = {
        recurringBills: (state.recurringBills || []).filter((b) => b.id !== id),
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('recurringBill', { id }, { action: 'delete' });
      return newState;
    });
  },

  payRecurringBill: (id, { accountId, date, note, amount } = {}) => {
    set((state) => {
      const bill = (state.recurringBills || []).find((b) => b.id === id);
      if (!bill) return {};

      const payAmount = Number(amount !== undefined ? amount : bill.amount);
      const payDate = date || new Date().toISOString().slice(0, 10);
      const monthKey = payDate.slice(0, 7);
      const targetAccountId = accountId || bill.accountId || state.accounts[0]?.id;

      // 1. Deduct balance from account
      let accounts = state.accounts;
      if (targetAccountId) {
        accounts = state.accounts.map((a) => {
          if (a.id === targetAccountId) {
            return { ...a, balance: (Number(a.balance) || 0) - payAmount };
          }
          return a;
        });
      }

      // 2. Create expense transaction
      const newTxn = {
        id: generateId(),
        type: 'expense',
        amount: payAmount,
        accountId: targetAccountId || '',
        categoryId: bill.categoryId || 'utilities',
        date: payDate,
        description: note || `${bill.name} (Recurring Payment)`,
        recurring: true,
        recurringBillId: bill.id,
        createdAt: new Date().toISOString(),
      };

      // 3. Add to paidMonths for bill
      const currentPaid = bill.paidMonths || [];
      const paidMonths = currentPaid.includes(monthKey) ? currentPaid : [...currentPaid, monthKey];

      const updatedBills = (state.recurringBills || []).map((b) =>
        b.id === id ? { ...b, paidMonths } : b
      );

      const newState = {
        accounts,
        transactions: [newTxn, ...state.transactions],
        recurringBills: updatedBills,
      };

      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('recurringBill', updatedBills.find((b) => b.id === id));
      backgroundSync('transaction', newTxn);
      if (targetAccountId) {
        backgroundSync('accounts', accounts);
      }
      return newState;
    });
  },

  toggleRecurringBillPaid: (id, targetMonthKey) => {
    set((state) => {
      const nowKey = targetMonthKey || new Date().toISOString().slice(0, 7);
      const updatedBills = (state.recurringBills || []).map((b) => {
        if (b.id !== id) return b;
        const currentPaidMonths = b.paidMonths || [];
        const isPaid = currentPaidMonths.includes(nowKey);
        return {
          ...b,
          paidMonths: isPaid
            ? currentPaidMonths.filter((m) => m !== nowKey)
            : [...currentPaidMonths, nowKey],
        };
      });

      const newState = {
        recurringBills: updatedBills,
      };
      setTimeout(() => saveToStorage(get()), 0);
      backgroundSync('recurringBill', updatedBills.find((b) => b.id === id));
      return newState;
    });
  },

  // ---- Guided Interactive Tour (Phase 1d) ----
  startTour: () => set({ isTourOpen: true, tourStep: 0 }),
  endTour: () => {
    set({ isTourOpen: false, tourCompleted: true });
    setTimeout(() => saveToStorage(get()), 0);
  },
  nextTourStep: () => set((state) => ({ tourStep: state.tourStep + 1 })),
  prevTourStep: () => set((state) => ({ tourStep: Math.max(0, state.tourStep - 1) })),
  setTourStep: (step) => set({ tourStep: step }),

  // ---- Reset ----
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    set(initialState);
  },

  // ---- Computed Helpers ----
  getTotalBalance: () => {
    return get().accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  },

  getTotalSavings: () => {
    return (get().savingsGoals || []).reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  },

  getTotalLockedFunds: () => {
    return (get().savingsGoals || [])
      .filter((g) => g.isLocked || g.type === 'fdr' || g.type === 'dps')
      .reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  },

  getSavingsGoalById: (id) => {
    return (get().savingsGoals || []).find((g) => g.id === id);
  },

  getMonthlyTransactions: (year, month) => {
    return get().transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  getMonthlyIncome: (year, month) => {
    return get()
      .getMonthlyTransactions(year, month)
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getMonthlyExpense: (year, month) => {
    return get()
      .getMonthlyTransactions(year, month)
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getCategorySpending: (year, month) => {
    const expenses = get()
      .getMonthlyTransactions(year, month)
      .filter((t) => t.type === 'expense');

    const spending = {};
    expenses.forEach((t) => {
      spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount;
    });
    return spending;
  },

  getAccountById: (id) => {
    return get().accounts.find((a) => a.id === id);
  },

  getCategoryById: (type, id) => {
    const cats = get().categories[type] || [];
    return cats.find((c) => c.id === id);
  },
}));

export default useStore;
