import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  SlidersHorizontal,
  ChevronRight,
  CreditCard,
  Plus,
  Building2,
  Smartphone,
  Banknote,
  Sparkles,
  Eye,
  EyeOff,
  Wifi,
  ShieldCheck,
  Lock,
  Target,
  Calculator,
  ArrowRight,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import FinancialModeCard from '../components/modes/FinancialModeCard.jsx';
import AiAdvisorModal from '../components/ai/AiAdvisorModal.jsx';
import RecurringBillsSection from '../components/recurring/RecurringBillsSection.jsx';
import { analyzeFinancialHealth } from '../utils/aiAdvisor.js';
import { ProviderLogo } from '../lib/accountProviders.jsx';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, lang, formatCurrency, formatDate } = useTranslation();
  const { accounts, transactions, categories, openQuickAdd, theme, financialMode, modeSettings, savingsGoals, openSavingsModal, openCalculatorModal, startTour } = useStore();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Persistent balance visibility
  const [showBalance, setShowBalance] = useState(() => {
    try {
      return localStorage.getItem('hisab_cockpit_show_balance') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleBalance = () => {
    setShowBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hisab_cockpit_show_balance', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Only 4 filters: '7days' | '30days' | 'month' | 'year'
  const [breakdownFilter, setBreakdownFilter] = useState('month');
  const [trendHorizon, setTrendHorizon] = useState('month');
  const [showAiModal, setShowAiModal] = useState(false);

  const totalSavings = useMemo(() => {
    return (savingsGoals || []).reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [savingsGoals]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  }, [accounts]);

  // Point 3: Calculate 30 days of data for Monthly Income, Monthly Expenses, Net Savings
  const thirtyDaysData = useMemo(() => {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const txns30d = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= thirtyDaysAgo;
    });

    const income = txns30d.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = txns30d.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

    return { income, expense, savings, savingsRate };
  }, [transactions]);

  const monthlyData = thirtyDaysData;

  const aiAnalysis = useMemo(() => {
    return analyzeFinancialHealth({
      accounts,
      transactions,
      budgets: [],
      savingsGoals,
      financialMode,
      modeSettings,
      monthlySalary: 0,
      lang,
    });
  }, [accounts, transactions, savingsGoals, financialMode, modeSettings, lang]);

  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [transactions]);

  // Category spending calculated based on filter (7days, 30days, month, year)
  const categorySpending = useMemo(() => {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filtered = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      if (breakdownFilter === '7days') {
        return d >= sevenDaysAgo;
      }
      if (breakdownFilter === '30days') {
        return d >= thirtyDaysAgo;
      }
      if (breakdownFilter === 'month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (breakdownFilter === 'year') {
        return d.getFullYear() === currentYear;
      }
      return true;
    });

    const catSpend = {};
    filtered.forEach((t) => {
      catSpend[t.categoryId] = (catSpend[t.categoryId] || 0) + (t.amount || 0);
    });
    return catSpend;
  }, [transactions, breakdownFilter, currentYear, currentMonth]);

  const breakdownSubtitle = useMemo(() => {
    if (breakdownFilter === '7days') return lang === 'bn' ? 'গত ৭ দিন' : 'Last 7 Days';
    if (breakdownFilter === '30days') return lang === 'bn' ? 'গত ৩০ দিন' : 'Past 30 Days';
    if (breakdownFilter === 'month') return lang === 'bn' ? 'চলতি মাস' : 'This Month';
    if (breakdownFilter === 'year') return lang === 'bn' ? `চলতি বছর (${currentYear})` : `This Year (${currentYear})`;
    return t('dashboard.thisMonth');
  }, [breakdownFilter, currentYear, lang, t]);

  // Trend data calculated based on filter (7days, 30days, month, year)
  const trendData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 1. Year: 12 months
    if (trendHorizon === 'year') {
      return monthNames.map((label, m) => {
        const monthTxns = transactions.filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === currentYear && d.getMonth() === m;
        });
        return {
          label,
          income: monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    }

    // 2. Month: 4 Weeks of current month
    if (trendHorizon === 'month') {
      const weeks = [
        { label: 'W1 (1-7)', start: 1, end: 7 },
        { label: 'W2 (8-14)', start: 8, end: 14 },
        { label: 'W3 (15-21)', start: 15, end: 21 },
        { label: 'W4 (22+)', start: 22, end: 31 },
      ];
      return weeks.map((w) => {
        const weekTxns = transactions.filter((t) => {
          const d = new Date(t.date);
          const day = d.getDate();
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth && day >= w.start && day <= w.end;
        });
        return {
          label: w.label,
          income: weekTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: weekTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    }

    // 3. Past 30 Days: 5 intervals of 6 days
    if (trendHorizon === '30days') {
      const intervals = [];
      for (let i = 4; i >= 0; i--) {
        const startD = new Date(now.getTime() - (i + 1) * 6 * 24 * 60 * 60 * 1000);
        const endD = new Date(now.getTime() - i * 6 * 24 * 60 * 60 * 1000);
        const label = `${startD.getDate()}/${startD.getMonth() + 1}-${endD.getDate()}/${endD.getMonth() + 1}`;
        const txns = transactions.filter((t) => {
          const d = new Date(t.date);
          return d >= startD && d <= endD;
        });
        intervals.push({
          label,
          income: txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return intervals;
    }

    // 4. Last 7 Days: Individual days (Today - 6 days through Today)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth();
      const d = targetDate.getDate();
      const dayTxns = transactions.filter((t) => {
        const dt = new Date(t.date);
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
      });
      const label = `${dayNames[targetDate.getDay()]} ${d}`;
      days.push({
        label,
        income: dayTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return days;
  }, [transactions, trendHorizon, currentYear, currentMonth]);

  const trendSubtitle = useMemo(() => {
    if (trendHorizon === '7days') return lang === 'bn' ? 'গত ৭ দিন' : 'Last 7 Days';
    if (trendHorizon === '30days') return lang === 'bn' ? 'গত ৩০ দিন' : 'Past 30 Days';
    if (trendHorizon === 'month') return lang === 'bn' ? 'চলতি মাস' : 'This Month';
    if (trendHorizon === 'year') return lang === 'bn' ? `চলতি বছর (${currentYear})` : `This Year (${currentYear})`;
    return lang === 'bn' ? 'চলতি মাস' : 'This Month';
  }, [trendHorizon, currentYear, lang]);

  const getCategoryInfo = (categoryId, type) => {
    const allCats = categories[type] || [];
    return allCats.find((c) => c.id === categoryId);
  };

  const getCategoryLabel = (categoryId, type) => {
    const cat = getCategoryInfo(categoryId, type);
    if (!cat) return categoryId;
    if (cat.custom) return cat.label;
    return t(`categories.${type}.${cat.key}`);
  };

  const getAccountInfo = (accountId) => {
    return accounts.find((a) => a.id === accountId);
  };

  const getSourceGradient = (account) => {
    if (!account) return 'var(--color-primary)';
    const name = account.name.toLowerCase();
    if (account.type === 'mfs') {
      if (name.includes('bkash') || name.includes('বিকাশ')) return 'var(--color-bkash-gradient)';
      if (name.includes('nagad') || name.includes('নগদ')) return 'var(--color-nagad-gradient)';
      return 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)';
    }
    if (account.type === 'bank') return 'var(--color-bank-gradient)';
    return 'var(--color-wallet-gradient)';
  };

  const getSourceIcon = (type) => {
    if (type === 'mfs') return <Smartphone size={16} />;
    if (type === 'bank') return <Building2 size={16} />;
    return <Banknote size={16} />;
  };

  // Chart configs
  const doughnutData = useMemo(() => {
    const entries = Object.entries(categorySpending);
    if (entries.length === 0) return null;

    const labels = entries.map(([id]) => getCategoryLabel(id, 'expense'));
    const data = entries.map(([, v]) => v);
    const colors = entries.map(([id]) => {
      const cat = getCategoryInfo(id, 'expense');
      return cat?.color || '#94A3B8';
    });

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6,
      }],
    };
  }, [categorySpending]);

  const barData = useMemo(() => ({
    labels: trendData.map((d) => d.label),
    datasets: [
      {
        label: t('transactions.income'),
        data: trendData.map((d) => d.income),
        backgroundColor: '#5ED21C',
        borderRadius: 8,
        barPercentage: 0.55,
      },
      {
        label: t('transactions.expense'),
        data: trendData.map((d) => d.expense),
        backgroundColor: '#F43F5E',
        borderRadius: 8,
        barPercentage: 0.55,
      },
    ],
  }), [trendData, t]);

  const isDark = theme === 'dark';
  const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(17, 20, 17, 0.08)';
  const chartTickColor = isDark ? '#94A3B8' : '#556054';
  const chartLabelColor = isDark ? '#CBD5E1' : '#3B453A';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(17, 20, 17, 0.95)',
        padding: 12,
        cornerRadius: 10,
        titleFont: { family: 'Outfit', size: 13, weight: '700' },
        bodyFont: { family: 'Outfit', size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartTickColor, font: { family: 'Outfit', size: 11, weight: '600' } },
      },
      y: {
        grid: { color: chartGridColor },
        ticks: {
          color: chartTickColor,
          font: { family: 'Outfit', size: 11 },
          callback: (v) => (v >= 1000 ? `${v / 1000}k` : v),
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartLabelColor,
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Outfit', size: 11, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(17, 20, 17, 0.95)',
        padding: 12,
        cornerRadius: 10,
        titleFont: { family: 'Outfit', size: 13, weight: '700' },
      },
    },
  };

  return (
    <div className="animate-fade-in">
      {/* Top Page Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <div className="dashboard-header-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/analytics')}
            title="Analytics Hub"
            style={{ gap: 6 }}
          >
            <BarChart3 size={15} color="var(--color-primary)" />
            <span>{lang === 'bn' ? 'অ্যানালিটিক্স' : 'Analytics Hub'}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={startTour}
            title={t('tour.start')}
            style={{ gap: 6 }}
          >
            <Sparkles size={15} color="#5ED21C" />
            <span>{t('tour.start')}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openQuickAdd('expense')}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t('transactions.addTransaction') || 'Quick Add'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          1. HERO BALANCE CARD (Fintech Metallic / Obsidian Card)
          ======================================================== */}
      <div className="hero-card animate-fade-in-up" data-tour="hero-card" style={{ marginBottom: 10 }}>
        {/* Subtle Ambient Emerald Aura (Clean, Not Crowded) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(94, 210, 28, 0.18) 0%, rgba(94, 210, 28, 0.04) 55%, transparent 75%)',
            pointerEvents: 'none',
            zIndex: 0,
            borderRadius: '50%',
          }}
        />

        {/* Card Top Header */}
        <div className="hero-card-header">
          <div className="hero-card-chip">
            <div className="hero-emv-microchip" />
            <span>HISAB PLATINUM</span>
            <Wifi size={13} style={{ transform: 'rotate(90deg)', opacity: 0.65 }} />
          </div>
          <div className="hero-status-tag">
            <div className="hero-status-dot" />
            <span>BDT ৳ Active</span>
          </div>
        </div>

        {/* Balance & Physical Card Visual Row */}
        <div className="hero-balance-row">
          <div className="hero-balance-info">
            <div className="hero-balance-label-wrap">
              <span className="hero-card-label">{t('dashboard.totalBalance')}</span>
              <button
                type="button"
                className="hero-privacy-toggle"
                onClick={toggleBalance}
                title={showBalance ? (lang === 'bn' ? 'ব্যালেন্স লুকান' : 'Hide Balance') : (lang === 'bn' ? 'ব্যালেন্স দেখুন' : 'Show Balance')}
              >
                {showBalance ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{showBalance ? (lang === 'bn' ? 'লুকান' : 'Hide') : (lang === 'bn' ? 'দেখুন' : 'Show')}</span>
              </button>
            </div>

            <div className="hero-card-balance">
              {showBalance ? formatCurrency(totalBalance) : '••••••••'}
            </div>

            <div className="hero-balance-meta">
              <span className="hero-meta-pill">
                <ShieldCheck size={13} color="#207208" />
                <span>
                  {accounts.length} {accounts.length === 1 ? (lang === 'bn' ? 'উৎস যুক্ত' : 'Source Linked') : (lang === 'bn' ? 'উৎস যুক্ত' : 'Sources Linked')}
                </span>
              </span>
              {totalSavings > 0 && (
                <span
                  className="hero-meta-pill"
                  onClick={() => navigate('/savings')}
                  style={{ cursor: 'pointer' }}
                  title="View Savings & Goals"
                >
                  <PiggyBank size={13} color="#207208" />
                  <span>+{formatCurrency(totalSavings)} {lang === 'bn' ? 'সঞ্চয় ও লকড' : 'Saved & Locked'}</span>
                </span>
              )}
              {monthlyData.savingsRate > 0 && (
                <span className="hero-meta-pill savings">
                  <TrendingUp size={13} color="#207208" />
                  <span>{monthlyData.savingsRate}% {lang === 'bn' ? 'সঞ্চয়' : 'Savings Rate'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Liquid Runway & Financial Health Score Widget (Option 3) */}
          <div
            className="hero-health-widget"
            onClick={() => setShowAiModal(true)}
            title={lang === 'bn' ? 'পূর্ণ এআই আর্থিক স্বাস্থ্য রিপোর্ট দেখুন' : 'View Full AI Financial Health Report'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAiModal(true); }}
          >
            {/* Header: Health Label & High-Contrast Score Badge */}
            <div className="hero-health-header">
              <div className="hero-health-title-wrap">
                <ShieldCheck size={15} className="hero-health-shield-icon" />
                <span className="hero-health-title">
                  {lang === 'bn' ? 'আর্থিক স্বাস্থ্য' : 'Health Score'}
                </span>
              </div>
              <div className="hero-health-score-badge">
                <span
                  className="hero-health-score-dot"
                  style={{ backgroundColor: aiAnalysis.scoreColor || '#22C55E' }}
                />
                <span className="hero-health-score-num">{aiAnalysis.score}</span>
                <span className="hero-health-score-max">/100</span>
              </div>
            </div>

            {/* Core Metric: Liquid Runway Buffer */}
            <div className="hero-health-metric-row">
              <div className="hero-runway-value-wrap">
                <span className="hero-runway-val">{aiAnalysis.runwayMonths}</span>
                <span className="hero-runway-unit">{lang === 'bn' ? 'মাস' : 'Months'}</span>
              </div>
              <div className="hero-runway-desc">
                {lang === 'bn' ? 'জরুরী তরল রানওয়ে' : 'Liquid Safety Runway'}
              </div>
            </div>

            {/* Footer: Rating status & CTA */}
            <div className="hero-health-footer">
              <div className="hero-health-status">
                <span className="hero-health-pulse-wrap">
                  <span
                    className="hero-health-pulse-ring"
                    style={{ backgroundColor: aiAnalysis.scoreColor || '#22C55E' }}
                  />
                  <span
                    className="hero-health-pulse-dot"
                    style={{ backgroundColor: aiAnalysis.scoreColor || '#22C55E' }}
                  />
                </span>
                <span className="hero-health-status-text">{aiAnalysis.scoreLabel}</span>
              </div>
              <div className="hero-health-cta">
                <Sparkles size={11} />
                <span>{lang === 'bn' ? 'রিপোর্ট' : 'Report'}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Tactile Floating Quick Action Cards */}
        <div className="hero-actions-grid">
          <button
            type="button"
            className="hero-action-card expense"
            onClick={() => openQuickAdd('expense')}
            title="Add Expense"
          >
            <div className="hero-action-icon-circle expense">
              <ArrowDownLeft size={20} strokeWidth={2.5} />
            </div>
            <div className="hero-action-text">
              <span className="hero-action-name">{t('transactions.expense')}</span>
              <span className="hero-action-hint">{lang === 'bn' ? 'টাকা খরচ' : 'Debit Out'}</span>
            </div>
          </button>

          <button
            type="button"
            className="hero-action-card income"
            onClick={() => openQuickAdd('income')}
            title="Add Income"
          >
            <div className="hero-action-icon-circle income">
              <ArrowUpRight size={20} strokeWidth={2.5} />
            </div>
            <div className="hero-action-text">
              <span className="hero-action-name">{t('transactions.income')}</span>
              <span className="hero-action-hint">{lang === 'bn' ? 'টাকা যোগ' : 'Credit In'}</span>
            </div>
          </button>

          <button
            type="button"
            className="hero-action-card transfer"
            onClick={() => navigate('/accounts')}
            title="Transfer Money"
          >
            <div className="hero-action-icon-circle transfer">
              <ArrowLeftRight size={20} strokeWidth={2.5} />
            </div>
            <div className="hero-action-text">
              <span className="hero-action-name">{t('accounts.transfer')}</span>
              <span className="hero-action-hint">{lang === 'bn' ? 'স্থানান্তর' : 'Move Funds'}</span>
            </div>
          </button>

          <button
            type="button"
            className="hero-action-card adjust"
            onClick={() => navigate('/accounts')}
            title="Manual Adjust"
          >
            <div className="hero-action-icon-circle adjust">
              <SlidersHorizontal size={20} strokeWidth={2.5} />
            </div>
            <div className="hero-action-text">
              <span className="hero-action-name">{t('accounts.adjustBalance')}</span>
              <span className="hero-action-hint">{lang === 'bn' ? 'সমন্বয়' : 'Rebalance'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================
          1.5. FINANCIAL ENGINE COCKPIT (Saver, Balanced, Growth Modes)
          ======================================================== */}
      <div style={{ marginBottom: 10 }}>
        <FinancialModeCard />
      </div>

      {/* ========================================================
          2. VIRTUAL ACCOUNT SOURCE CARDS (Swipeable Strip)
          ======================================================== */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
            {t('accounts.title')} ({accounts.length})
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/accounts')}
            style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)' }}
          >
            {t('dashboard.viewAll')} <ChevronRight size={14} />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48, marginBottom: 'var(--space-1)' }}>
                <Wallet size={22} />
              </div>
              <p className="empty-state-title" style={{ fontSize: 'var(--text-md)' }}>
                {t('accounts.noAccounts')}
              </p>
              <p className="empty-state-desc" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                {t('accounts.noAccountsDesc')}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/accounts')}
              >
                <Plus size={16} /> {t('accounts.addAccount')}
              </button>
            </div>
          </div>
        ) : (
          <div className="source-cards-scroll no-scrollbar">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="source-card"
                onClick={() => navigate('/accounts')}
                style={{ '--card-brand-gradient': getSourceGradient(acc) }}
              >
                <div className="source-card-header">
                  <div className="source-card-badge">
                    {acc.type.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ProviderLogo providerId={acc.providerId} name={acc.name} type={acc.type} size={18} />
                  </div>
                </div>
                <div>
                  <div className="source-card-name">{acc.name}</div>
                  <div className="source-card-balance">{formatCurrency(acc.balance)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          3. PULSE STATS (Calculates 30 Days of Data)
          ======================================================== */}
      <div className="grid-3 dashboard-stats-grid stagger-children" style={{ marginBottom: 10 }}>
        {/* Income Card */}
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="stat-label">{t('dashboard.monthlyIncome')}</span>
            <div className="stat-icon-wrap" style={{ background: 'var(--color-income-light)', color: 'var(--color-income)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--color-income)' }}>
              {formatCurrency(thirtyDaysData.income)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {t('dashboard.past30Days')}
            </div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="stat-label">{t('dashboard.monthlyExpense')}</span>
            <div className="stat-icon-wrap" style={{ background: 'var(--color-expense-light)', color: 'var(--color-expense)' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--color-expense)' }}>
              {formatCurrency(thirtyDaysData.expense)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {t('dashboard.past30Days')}
            </div>
          </div>
        </div>

        {/* Net Savings Card */}
        <div className="card stat-card">
          <div className="stat-card-top">
            <span className="stat-label">{t('dashboard.monthlySavings')}</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(94, 210, 28, 0.15)', color: 'var(--color-primary)' }}>
              <PiggyBank size={20} />
            </div>
          </div>
          <div>
            <div className="stat-value" style={{ color: thirtyDaysData.savings >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {formatCurrency(thirtyDaysData.savings)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {thirtyDaysData.savingsRate}% {t('dashboard.savingsRate')}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          AI FINANCIAL ADVISOR INSIGHT (Jet Black & Electric Lime Card)
          ======================================================== */}
      <div className="insight-card animate-fade-in-up" style={{ marginBottom: 10 }}>
        <div className="insight-card-body" style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
          <div className="insight-badge">
            <Sparkles size={12} />
            <span>AI Advisor • {aiAnalysis.score}/100 ({aiAnalysis.scoreLabel})</span>
          </div>
          <div className="insight-title">
            {aiAnalysis.insights[0]?.title || (lang === 'bn' ? 'আপনার আর্থিক অবস্থা সুদৃঢ়' : 'Financially Disciplined & On Track')}
          </div>
          <div className="insight-desc">
            {aiAnalysis.insights[0]?.desc || (lang === 'bn'
              ? 'নিয়মিত আয় ও খরচের হিসাব পর্যালোচনা করে সম্ভাব্য ঝুঁকি আগেই শনাক্ত করা যায়।'
              : `Your liquid runway provides ${aiAnalysis.runwayMonths} months of buffer at an average daily burn of ৳${aiAnalysis.avgDailyBurn}.`)}
          </div>
        </div>
        <div className="insight-card-actions" style={{ flexShrink: 0, zIndex: 1 }}>
          <button
            type="button"
            className="btn btn-sm btn-lime insight-report-btn"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles size={14} />
            <span>{lang === 'bn' ? 'পূর্ণ এআই রিপোর্ট' : 'Full AI Report'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          USER-CONFIGURED MONTHLY RECURRING BILLS & SUBSCRIPTIONS
          ======================================================== */}
      <div style={{ marginBottom: 10 }}>
        <RecurringBillsSection />
      </div>

      {/* ========================================================
          SAVINGS, DPS & LOCKED FUNDS SHOWCASE
          ======================================================== */}
      <div className="card savings-showcase-card animate-fade-in-up" style={{ marginBottom: 10 }}>
        <div className="savings-showcase-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="savings-showcase-icon-cube">
              <PiggyBank size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="card-title" style={{ margin: 0 }}>{t('savings.title')}</h3>
              <p className="card-subtitle" style={{ margin: '3px 0 0' }}>{t('savings.subtitle')}</p>
            </div>
          </div>

          <div className="savings-showcase-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => openCalculatorModal()}
              style={{ gap: 6 }}
            >
              <Calculator size={14} />
              <span className="btn-text-full">{t('savings.calculatePurchase')}</span>
              <span className="btn-text-short">{lang === 'bn' ? 'ক্যালকুলেটর' : 'Calculator'}</span>
            </button>
            <button
              type="button"
              className="btn btn-lime btn-sm"
              onClick={() => openSavingsModal()}
              style={{ gap: 6 }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>{t('savings.newGoal')}</span>
            </button>
          </div>
        </div>

        {/* Mini Preview Items List */}
        <div className="savings-preview-deck">
          {savingsGoals.slice(0, 3).map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            return (
              <div
                key={g.id}
                className="savings-preview-item"
                onClick={() => navigate('/savings')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {g.isLocked ? <Lock size={13} color="#D97706" /> : <Target size={13} color="#5ED21C" />}
                    <span className="savings-preview-name">{g.name}</span>
                  </div>
                  <span className="savings-preview-pct">{pct}%</span>
                </div>
                <div className="savings-preview-track">
                  <div className="savings-preview-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>{formatCurrency(g.currentAmount)}</span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>of {formatCurrency(g.targetAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Footer Link - Centered */}
        <div className="savings-showcase-footer">
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            {lang === 'bn' ? 'মোট পুঞ্জীভূত সঞ্চয় ও লকড ফান্ডস:' : 'Total accumulated savings & locked funds:'}{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totalSavings)}</strong>
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm savings-view-all-btn"
            onClick={() => navigate('/savings')}
            style={{ gap: 6, color: 'var(--color-primary-dark)', fontWeight: 'bold' }}
          >
            <span>{lang === 'bn' ? 'সকল সঞ্চয় ও প্রক্ষেপণ দেখুন' : 'View All Savings & Projections'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================
          4. CHARTS ROW (Spending Breakdown & Trend)
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10, marginBottom: 10 }}>
        {/* Spending Breakdown Donut */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>{t('dashboard.spendingBreakdown')}</h3>
              <div className="card-subtitle" style={{ margin: '2px 0 0' }}>{breakdownSubtitle}</div>
            </div>

            {/* Strict 4 Filter Options: Last 7 Days, Past 30 Days, This Month, This Year */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: '7days', label: lang === 'bn' ? 'গত ৭ দিন' : 'Last 7 Days' },
                { id: '30days', label: lang === 'bn' ? 'গত ৩০ দিন' : 'Past 30 Days' },
                { id: 'month', label: lang === 'bn' ? 'চলতি মাস' : 'This Month' },
                { id: 'year', label: lang === 'bn' ? 'চলতি বছর' : 'This Year' },
              ].map((opt) => {
                const active = breakdownFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBreakdownFilter(opt.id)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 'var(--weight-semibold)',
                      background: active ? 'var(--color-primary)' : 'var(--glass-bg-subtle)',
                      color: active ? '#111411' : 'var(--color-text-secondary)',
                      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {doughnutData ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                <PiggyBank size={32} style={{ margin: '0 auto var(--space-2)', opacity: 0.5 }} />
                <p>{t('common.noData')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Income vs Expense Bar */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>{t('dashboard.incomeVsExpense')}</h3>
              <div className="card-subtitle" style={{ margin: '2px 0 0' }}>{trendSubtitle}</div>
            </div>

            {/* Strict 4 Filter Options: Last 7 Days, Past 30 Days, This Month, This Year */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: '7days', label: lang === 'bn' ? 'গত ৭ দিন' : 'Last 7 Days' },
                { id: '30days', label: lang === 'bn' ? 'গত ৩০ দিন' : 'Past 30 Days' },
                { id: 'month', label: lang === 'bn' ? 'চলতি মাস' : 'This Month' },
                { id: 'year', label: lang === 'bn' ? 'চলতি বছর' : 'This Year' },
              ].map((opt) => {
                const active = trendHorizon === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTrendHorizon(opt.id)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 'var(--weight-semibold)',
                      background: active ? 'var(--color-primary)' : 'var(--glass-bg-subtle)',
                      color: active ? '#111411' : 'var(--color-text-secondary)',
                      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ height: 260 }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* ========================================================
          5. RECENT TRANSACTIONS
          ======================================================== */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">{t('dashboard.recentTransactions')}</h3>
            <div className="card-subtitle">{t('transactions.subtitle')}</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/transactions')}
            style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)' }}
          >
            {t('dashboard.viewAll')} <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-6)' }}>
            <div className="empty-state-icon" style={{ width: 48, height: 48, marginBottom: 'var(--space-1)' }}>
              <ArrowLeftRight size={22} />
            </div>
            <p className="empty-state-title" style={{ fontSize: 'var(--text-md)' }}>
              {t('dashboard.noTransactions')}
            </p>
            <p className="empty-state-desc" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
              {t('dashboard.noTransactionsDesc')}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => openQuickAdd('expense')}
            >
              <Plus size={16} /> {t('transactions.addTransaction')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {recentTransactions.map((txn) => {
              const cat = getCategoryInfo(txn.categoryId, txn.type);
              const acc = getAccountInfo(txn.accountId);
              const isIncome = txn.type === 'income';

              return (
                <div
                  key={txn.id}
                  className="transaction-row"
                  onClick={() => navigate('/transactions')}
                >
                  <div
                    className="transaction-icon"
                    style={{
                      background: cat ? `${cat.color}20` : 'var(--glass-bg-subtle)',
                      color: cat?.color || 'var(--color-text-primary)',
                    }}
                  >
                    {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>

                  <div className="transaction-details">
                    <div className="transaction-name">
                      {txn.description || getCategoryLabel(txn.categoryId, txn.type)}
                    </div>
                    <div className="transaction-meta">
                      <span>{formatDate(txn.date)}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
                        {acc?.name || 'Account'}
                      </span>
                    </div>
                  </div>

                  <div className={`transaction-amount ${isIncome ? 'income' : 'expense'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Financial Advisor Modal */}
      <AiAdvisorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
      />
    </div>
  );
}
