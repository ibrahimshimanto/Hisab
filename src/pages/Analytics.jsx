import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, TrendingUp, TrendingDown, ArrowRightLeft, ArrowRight,
  PieChart as PieIcon, BarChart3, ChevronLeft, ChevronRight,
  Filter, Sparkles, Download, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, MapPin, Store, DollarSign
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import RecurringBillsSection from '../components/recurring/RecurringBillsSection.jsx';
import AiAdvisorModal from '../components/ai/AiAdvisorModal.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const { t, lang, formatCurrency } = useTranslation();
  const { transactions, accounts, categories, settings, openQuickAdd } = useStore();

  const isDark = settings?.theme === 'dark';
  const [activeHorizon, setActiveHorizon] = useState('monthly'); // 'daily' | 'monthly' | 'yearly' | 'custom'

  // Daily filter state
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));

  // Monthly filter state & real-time calendar references
  const now = useMemo(() => new Date(), []);
  const currentYearToday = now.getFullYear();
  const currentMonthToday = now.getMonth();
  const currentDayToday = now.getDate();

  const [selectedYear, setSelectedYear] = useState(currentYearToday);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthToday); // 0-indexed

  // Constraints: cannot navigate into future months
  const isCurrentOrFutureMonth =
    selectedYear > currentYearToday ||
    (selectedYear === currentYearToday && selectedMonth >= currentMonthToday);
  const canGoNextMonth = !isCurrentOrFutureMonth;
  const isViewingPastMonth =
    selectedYear < currentYearToday ||
    (selectedYear === currentYearToday && selectedMonth < currentMonthToday);

  // Custom range state
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const setPresetRange = (days) => {
    const end = new Date();
    const start = new Date();
    if (days === 'month') {
      start.setDate(1);
    } else {
      start.setDate(start.getDate() - days);
    }
    setCustomStart(start.toISOString().slice(0, 10));
    setCustomEnd(end.toISOString().slice(0, 10));
  };

  const isPresetActive = (days) => {
    const today = new Date().toISOString().slice(0, 10);
    if (customEnd !== today) return false;
    const start = new Date();
    if (days === 'month') {
      start.setDate(1);
    } else {
      start.setDate(start.getDate() - days);
    }
    return customStart === start.toISOString().slice(0, 10);
  };

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(currentMonthToday);
    setSelectedYear(currentYearToday);
  };

  // Month Names
  const monthNames = useMemo(() => [
    lang === 'bn' ? 'জানুয়ারি' : 'January',
    lang === 'bn' ? 'ফেব্রুয়ারি' : 'February',
    lang === 'bn' ? 'মার্চ' : 'March',
    lang === 'bn' ? 'এপ্রিল' : 'April',
    lang === 'bn' ? 'মে' : 'May',
    lang === 'bn' ? 'জুন' : 'June',
    lang === 'bn' ? 'জুলাই' : 'July',
    lang === 'bn' ? 'আগস্ট' : 'August',
    lang === 'bn' ? 'সেপ্টেম্বর' : 'September',
    lang === 'bn' ? 'অক্টোবর' : 'October',
    lang === 'bn' ? 'নভেম্বর' : 'November',
    lang === 'bn' ? 'ডিসেম্বর' : 'December',
  ], [lang]);

  // 1. FILTERED TRANSACTIONS BASED ON ACTIVE HORIZON
  const filteredData = useMemo(() => {
    let txns = [];

    if (activeHorizon === 'daily') {
      txns = transactions.filter((t) => t.date && t.date.slice(0, 10) === selectedDay);
    } else if (activeHorizon === 'monthly') {
      txns = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
    } else if (activeHorizon === 'yearly') {
      txns = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear;
      });
    } else if (activeHorizon === 'custom') {
      txns = transactions.filter((t) => {
        const dateStr = t.date.slice(0, 10);
        return dateStr >= customStart && dateStr <= customEnd;
      });
    }

    const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const netCashFlow = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

    // Category grouping
    const categoryTotals = {};
    txns.filter((t) => t.type === 'expense').forEach((t) => {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + (t.amount || 0);
    });

    return {
      txns,
      income,
      expense,
      netCashFlow,
      savingsRate,
      categoryTotals,
    };
  }, [transactions, activeHorizon, selectedDay, selectedYear, selectedMonth, customStart, customEnd]);

  // 2. DAY OF WEEK PATTERNS
  const dayOfWeekData = useMemo(() => {
    const days = [
      lang === 'bn' ? 'রবি' : 'Sun',
      lang === 'bn' ? 'সোম' : 'Mon',
      lang === 'bn' ? 'মঙ্গল' : 'Tue',
      lang === 'bn' ? 'বুধ' : 'Wed',
      lang === 'bn' ? 'বৃহঃ' : 'Thu',
      lang === 'bn' ? 'শুক্র' : 'Fri',
      lang === 'bn' ? 'শনি' : 'Sat',
    ];
    const totals = [0, 0, 0, 0, 0, 0, 0];

    filteredData.txns.filter((t) => t.type === 'expense').forEach((t) => {
      const d = new Date(t.date);
      totals[d.getDay()] += t.amount;
    });

    return {
      labels: days,
      datasets: [
        {
          label: lang === 'bn' ? 'ব্যয়' : 'Expense',
          data: totals,
          backgroundColor: '#5ED21C',
          borderRadius: 6,
        },
      ],
    };
  }, [filteredData.txns, lang]);

  // 3. MONTHLY TRAJECTORY FOR YEARLY HORIZON
  const yearlyTrajectoryData = useMemo(() => {
    const monthlyIncomes = new Array(12).fill(0);
    const monthlyExpenses = new Array(12).fill(0);

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        if (t.type === 'income') monthlyIncomes[m] += t.amount;
        if (t.type === 'expense') monthlyExpenses[m] += t.amount;
      }
    });

    return {
      labels: monthNames.map((m) => m.slice(0, 3)),
      datasets: [
        {
          label: lang === 'bn' ? 'আয় (Inflow)' : 'Inflow',
          data: monthlyIncomes,
          backgroundColor: '#5ED21C',
          borderRadius: 6,
        },
        {
          label: lang === 'bn' ? 'ব্যয় (Outflow)' : 'Outflow',
          data: monthlyExpenses,
          backgroundColor: '#F43F5E',
          borderRadius: 6,
        },
      ],
    };
  }, [transactions, selectedYear, monthNames, lang]);

  // 4. CATEGORY DOUGHNUT
  const categoryDoughnutData = useMemo(() => {
    const entries = Object.entries(filteredData.categoryTotals);
    if (entries.length === 0) return null;

    const allExpenseCats = categories?.expense || [];
    const labels = entries.map(([id]) => {
      const cat = allExpenseCats.find((c) => c.id === id);
      return cat ? (cat.custom ? cat.label : t(`categories.expense.${cat.key}`)) : id;
    });

    const data = entries.map(([, v]) => v);
    const colors = entries.map(([id]) => {
      const cat = allExpenseCats.find((c) => c.id === id);
      return cat?.color || '#94A3B8';
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  }, [filteredData.categoryTotals, categories, t]);

  // 5. CALENDAR SPENDING HEATMAP GENERATION (Real-time calendar & past months)
  const calendarHeatmapDays = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyExpenseMap = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month && t.type === 'expense') {
        const dayNum = d.getDate();
        dailyExpenseMap[dayNum] = (dailyExpenseMap[dayNum] || 0) + t.amount;
      }
    });

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ blank: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const spent = dailyExpenseMap[d] || 0;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDay === dateStr;

      const isToday = year === currentYearToday && month === currentMonthToday && d === currentDayToday;
      const isFuture =
        year > currentYearToday ||
        (year === currentYearToday && month > currentMonthToday) ||
        (year === currentYearToday && month === currentMonthToday && d > currentDayToday);

      days.push({
        blank: false,
        dayNumber: d,
        dateStr,
        spent,
        isSelected,
        isToday,
        isFuture,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, transactions, selectedDay, currentYearToday, currentMonthToday, currentDayToday]);

  const chartTextColor = isDark ? '#94A3B8' : '#64748B';
  const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 20, 17, 0.06)';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">
            <span className="title-text-full">{lang === 'bn' ? 'পরিসংখ্যান ও অ্যানালিটিক্স হাব' : 'Analytics & Financial Statistics'}</span>
            <span className="title-text-short">{lang === 'bn' ? 'অ্যানালিটিক্স হাব' : 'Analytics'}</span>
          </h1>
          <p className="page-subtitle">
            <span className="subtitle-text-full">
              {lang === 'bn' ? 'ক্যাশ ফ্লো, ব্যয়ের গতিপ্রকৃতি ও দীর্ঘমেয়াদী আর্থিক প্রবণতা' : 'Comprehensive cash flows, spending velocity & multi-horizon trajectory'}
            </span>
            <span className="subtitle-text-short">
              {lang === 'bn' ? 'ক্যাশ ফ্লো ও ব্যয়ের গতিপ্রকৃতি' : 'Cash flows & velocity'}
            </span>
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-lime btn-sm header-action-btn"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles size={15} />
            <span className="btn-text-full">{lang === 'bn' ? 'এআই আর্থিক রিপোর্ট' : 'AI Financial Diagnosis'}</span>
            <span className="btn-text-short">{lang === 'bn' ? 'এআই রিপোর্ট' : 'AI Report'}</span>
          </button>
        </div>
      </div>

      {/* 1. HORIZON SELECTOR CAPSULE BAR */}
      <div className="analytics-date-filter-card">
        {/* Horizon Tabs (Symmetric Segmented Control) */}
        <div className="horizon-segmented-control">
          {[
            { id: 'daily', short: lang === 'bn' ? 'দৈনিক' : 'Daily', full: lang === 'bn' ? 'দৈনিক / নির্দিষ্ট দিন' : 'Daily / By Date' },
            { id: 'monthly', short: lang === 'bn' ? 'মাসিক' : 'Monthly', full: lang === 'bn' ? 'মাসিক পর্যালোচনা' : 'Monthly Overview' },
            { id: 'yearly', short: lang === 'bn' ? 'বাৎসরিক' : 'Yearly', full: lang === 'bn' ? 'বাৎসরিক গতিপথ' : 'Yearly Trajectory' },
            { id: 'custom', short: lang === 'bn' ? 'কাস্টম' : 'Custom', full: lang === 'bn' ? 'কাস্টম সময়সীমা' : 'Custom Period' },
          ].map((h) => {
            const isActive = activeHorizon === h.id;
            return (
              <button
                key={h.id}
                type="button"
                className={`horizon-segment-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveHorizon(h.id)}
              >
                <span className="btn-text-short">{h.short}</span>
                <span className="btn-text-full">{h.full}</span>
              </button>
            );
          })}
        </div>

        {/* Centered Dynamic Horizon Controls */}
        <div className="horizon-controls-bar">
          {activeHorizon === 'daily' && (
            <div className="horizon-daily-wrap">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedDay(new Date().toISOString().slice(0, 10))}
                style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}
              >
                <CalendarIcon size={14} />
                <span>{lang === 'bn' ? 'আজ' : 'Today'}</span>
              </button>
              <input
                type="date"
                className="horizon-date-input"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              />
            </div>
          )}

          {activeHorizon === 'monthly' && (
            <div className="horizon-stepper-wrap">
              <button
                type="button"
                className="btn btn-icon btn-secondary horizon-step-btn"
                onClick={handlePrevMonth}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="horizon-stepper-display">
                <span className="horizon-stepper-title">
                  {monthNames[selectedMonth]} {selectedYear}
                </span>
                {isViewingPastMonth && (
                  <button
                    type="button"
                    className="horizon-today-pill"
                    onClick={handleResetToCurrentMonth}
                  >
                    {lang === 'bn' ? 'চলতি মাস' : 'This Month'}
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn btn-icon btn-secondary horizon-step-btn"
                onClick={handleNextMonth}
                disabled={!canGoNextMonth}
                style={{
                  opacity: canGoNextMonth ? 1 : 0.35,
                  cursor: canGoNextMonth ? 'pointer' : 'not-allowed',
                  pointerEvents: canGoNextMonth ? 'auto' : 'none',
                }}
                title={lang === 'bn' ? 'পরবর্তী মাস' : 'Next Month'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {activeHorizon === 'yearly' && (
            <div className="horizon-yearly-wrap">
              {[2024, 2025, 2026].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYear(y)}
                  className={`btn btn-sm ${selectedYear === y ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '36px', padding: '0 16px', fontSize: '12px', minWidth: 64 }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {activeHorizon === 'custom' && (
            <div className="horizon-custom-wrap">
              <div className="horizon-custom-grid">
                <label className="horizon-custom-box">
                  <div className="horizon-custom-header">
                    <span className="horizon-custom-tag">{lang === 'bn' ? 'শুরুর তারিখ' : 'FROM'}</span>
                    <CalendarIcon size={12} className="horizon-custom-icon" />
                  </div>
                  <input
                    type="date"
                    className="horizon-custom-input"
                    value={customStart}
                    max={customEnd}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </label>

                <div className="horizon-custom-arrow">
                  <ArrowRight size={13} />
                </div>

                <label className="horizon-custom-box">
                  <div className="horizon-custom-header">
                    <span className="horizon-custom-tag">{lang === 'bn' ? 'শেষ তারিখ' : 'TO'}</span>
                    <CalendarIcon size={12} className="horizon-custom-icon" />
                  </div>
                  <input
                    type="date"
                    className="horizon-custom-input"
                    value={customEnd}
                    min={customStart}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </label>
              </div>

              {/* Quick Preset Ranges */}
              <div className="horizon-custom-presets">
                <button
                  type="button"
                  className={`horizon-preset-chip ${isPresetActive(7) ? 'active' : ''}`}
                  onClick={() => setPresetRange(7)}
                >
                  {lang === 'bn' ? '৭ দিন' : 'Last 7 Days'}
                </button>
                <button
                  type="button"
                  className={`horizon-preset-chip ${isPresetActive(30) ? 'active' : ''}`}
                  onClick={() => setPresetRange(30)}
                >
                  {lang === 'bn' ? '৩০ দিন' : 'Last 30 Days'}
                </button>
                <button
                  type="button"
                  className={`horizon-preset-chip ${isPresetActive('month') ? 'active' : ''}`}
                  onClick={() => setPresetRange('month')}
                >
                  {lang === 'bn' ? 'চলতি মাস' : 'This Month'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. EXECUTIVE 4 PULSE METRIC BOXES */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Total Inflow */}
        <div className="card stat-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
              {lang === 'bn' ? 'মোট আয় (Inflows)' : 'Total Inflows'}
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'rgba(94, 210, 28, 0.16)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary-dark)' }}>
            {formatCurrency(filteredData.income)}
          </div>
        </div>

        {/* Total Outflow */}
        <div className="card stat-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
              {lang === 'bn' ? 'মোট ব্যয় (Outflows)' : 'Total Outflows'}
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.16)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: '#F43F5E' }}>
            {formatCurrency(filteredData.expense)}
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="card stat-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
              {lang === 'bn' ? 'নেট ক্যাশ ফ্লো' : 'Net Cash Delta'}
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: filteredData.netCashFlow >= 0 ? 'rgba(94, 210, 28, 0.16)' : 'rgba(244, 63, 94, 0.16)', color: filteredData.netCashFlow >= 0 ? 'var(--color-primary-dark)' : '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: filteredData.netCashFlow >= 0 ? 'var(--color-primary-dark)' : '#F43F5E' }}>
            {filteredData.netCashFlow >= 0 ? `+${formatCurrency(filteredData.netCashFlow)}` : formatCurrency(filteredData.netCashFlow)}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="card stat-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
              {lang === 'bn' ? 'সঞ্চয় অনুপাত' : 'Savings Rate'}
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'rgba(94, 210, 28, 0.16)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
            {filteredData.savingsRate}%
          </div>
        </div>
      </div>

      {/* 3. DUAL CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Left Chart: Cash Flow Trajectory */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              {activeHorizon === 'yearly'
                ? (lang === 'bn' ? `${selectedYear} এর বাৎসরিক গতিপথ` : `${selectedYear} Annual Trajectory`)
                : (lang === 'bn' ? 'ক্যাশ ফ্লো তুলনা (ইনফ্লো বনাম আউটফ্লো)' : 'Inflow vs Outflow Dynamics')}
            </h3>
          </div>

          <div style={{ height: 260, position: 'relative' }}>
            {activeHorizon === 'yearly' ? (
              <Bar
                data={yearlyTrajectoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { display: false }, ticks: { color: chartTextColor } },
                    y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } },
                  },
                }}
              />
            ) : (
              <Bar
                data={dayOfWeekData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { display: false }, ticks: { color: chartTextColor } },
                    y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Right Chart: Category Distribution */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              {lang === 'bn' ? 'ব্যয়ের খাত বিভাজন' : 'Category Distribution'}
            </h3>
          </div>

          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {categoryDoughnutData ? (
              <Doughnut
                data={categoryDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: chartTextColor, boxWidth: 12, font: { size: 11 } } },
                  },
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                {lang === 'bn' ? 'এই সময়কালে কোনো ব্যয় রেকর্ড নেই' : 'No expenses recorded in this period'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE CALENDAR SPENDING HEATMAP (Monthly / Daily view) */}
      {(activeHorizon === 'monthly' || activeHorizon === 'daily') && (
        <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          {/* Card Header & Legend */}
          <div className="heatmap-header-wrap">
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                {lang === 'bn' ? 'দৈনিক ব্যয় ক্যালেন্ডার হিটম্যাপ' : 'Daily Spending Heatmap'}
              </h3>
              <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                {lang === 'bn' ? 'যে কোনো দিনের ওপর ক্লিক করে সেদিনের ব্যয় পর্যালোচনা করুন' : 'Tap any date cell to drill down into that day’s exact spending'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              <span>{lang === 'bn' ? 'স্বাভাবিক' : 'Low'}</span>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(94, 210, 28, 0.25)' }} />
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(245, 158, 11, 0.4)' }} />
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(244, 63, 94, 0.6)' }} />
              <span>{lang === 'bn' ? 'অধিক ব্যয়' : 'High'}</span>
            </div>
          </div>

          {/* Month Stepper Toolbar */}
          <div className="heatmap-nav-toolbar">
            <div className="heatmap-stepper">
              <button
                type="button"
                className="heatmap-step-btn"
                onClick={handlePrevMonth}
                title={lang === 'bn' ? 'পূর্ববর্তী মাস' : 'Previous Month'}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="heatmap-month-title">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                type="button"
                className="heatmap-step-btn"
                onClick={handleNextMonth}
                disabled={!canGoNextMonth}
                title={lang === 'bn' ? 'পরবর্তী মাস' : 'Next Month'}
              >
                <ChevronRight size={16} />
              </button>
              {isViewingPastMonth && (
                <button
                  type="button"
                  className="horizon-today-pill"
                  onClick={handleResetToCurrentMonth}
                >
                  {lang === 'bn' ? 'চলতি মাস' : 'This Month'}
                </button>
              )}
            </div>

            <div className="heatmap-status-badge">
              {isViewingPastMonth ? (
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  {lang === 'bn' ? 'অতীতের ব্যয় রেকর্ড' : 'Historical records (all dates enabled)'}
                </span>
              ) : (
                <>
                  <span className="heatmap-live-dot" />
                  <span>
                    {lang === 'bn'
                      ? `আজ ${currentDayToday} ${monthNames[currentMonthToday]}`
                      : `Live Calendar: Today is ${monthNames[currentMonthToday]} ${currentDayToday}`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', paddingBottom: 4 }}>
                {d}
              </div>
            ))}

            {calendarHeatmapDays.map((cell, idx) => {
              if (cell.blank) {
                return <div key={idx} style={{ height: 54, borderRadius: 'var(--radius-md)' }} />;
              }

              if (cell.isFuture) {
                return (
                  <div
                    key={idx}
                    className="heatmap-cell disabled"
                    style={{
                      height: 54,
                      padding: 4,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--color-border)',
                      opacity: 0.32,
                      cursor: 'not-allowed',
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      userSelect: 'none',
                    }}
                    title={lang === 'bn' ? 'ভবিষ্যতের তারিখ (অক্রিয়)' : 'Future date (disabled)'}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-tertiary)' }}>
                      {cell.dayNumber}
                    </span>
                  </div>
                );
              }

              let bg = 'var(--color-surface-secondary)';
              let border = '1px solid var(--color-border)';
              if (cell.spent > 5000) {
                bg = 'rgba(244, 63, 94, 0.18)';
                border = '1px solid rgba(244, 63, 94, 0.4)';
              } else if (cell.spent > 1000) {
                bg = 'rgba(245, 158, 11, 0.16)';
                border = '1px solid rgba(245, 158, 11, 0.35)';
              } else if (cell.spent > 0) {
                bg = 'rgba(94, 210, 28, 0.14)';
                border = '1px solid rgba(94, 210, 28, 0.3)';
              }

              if (cell.isToday) {
                border = '2px solid var(--color-primary)';
              } else if (cell.isSelected) {
                border = '2px solid var(--color-text-primary)';
              }

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDay(cell.dateStr);
                    setActiveHorizon('daily');
                  }}
                  className="heatmap-cell"
                  style={{
                    height: 54,
                    padding: 4,
                    borderRadius: 'var(--radius-md)',
                    background: bg,
                    border,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: cell.isToday ? 'var(--color-primary-dark)' : 'var(--color-text-primary)' }}>
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span style={{
                        fontSize: '8px',
                        fontWeight: 'var(--weight-bold)',
                        padding: '1px 3px',
                        borderRadius: '3px',
                        background: 'var(--color-primary)',
                        color: '#0D1117',
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}>
                        {lang === 'bn' ? 'আজ' : 'Today'}
                      </span>
                    )}
                  </div>
                  {cell.spent > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', color: cell.spent > 5000 ? '#F43F5E' : 'var(--color-primary-dark)' }}>
                      ৳{cell.spent.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. DAY DRILL-DOWN TRANSACTIONS (Shown if in daily mode or specific day selected) */}
      {activeHorizon === 'daily' && (
        <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                {lang === 'bn' ? `${selectedDay} তারিখের লেনদেন সমূহ` : `Transactions on ${selectedDay}`}
              </h3>
              <p className="card-subtitle" style={{ margin: '2px 0 0' }}>
                {filteredData.txns.length} {lang === 'bn' ? 'টি লেনদেন রেকর্ড হয়েছে' : 'transactions recorded for this date'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-lime"
              onClick={() => openQuickAdd('expense')}
            >
              + {lang === 'bn' ? 'লেনদেন যোগ করুন' : 'Add Entry'}
            </button>
          </div>

          {filteredData.txns.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredData.txns.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                      {t.note || t.categoryId}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                      {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t.categoryId}
                    </div>
                  </div>

                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', color: t.type === 'income' ? 'var(--color-primary-dark)' : '#F43F5E' }}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
              {lang === 'bn' ? 'এই তারিখে কোনো লেনদেন পাওয়া যায়নি' : 'No transactions recorded on this date'}
            </div>
          )}
        </div>
      )}

      {/* 6. USER-CONFIGURED RECURRING BILLS & SUBSCRIPTION TRACKER */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <RecurringBillsSection />
      </div>

      {/* AI Financial Advisor Modal */}
      <AiAdvisorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
      />
    </div>
  );
}
