import { useState, useMemo } from 'react';
import { Sliders, RotateCcw, ChevronDown, ChevronUp, Leaf, Scale, Compass, Rocket, Zap, Flame, ShieldAlert, Sparkles, TrendingUp, Info } from 'lucide-react';
import useStore from '../../store/useStore.js';
import { useTranslation } from '../../i18n/index.jsx';

export default function FinancialModeCard() {
  const { t, lang, formatCurrency } = useTranslation();
  const { financialMode, setFinancialMode, modeSettings, updateModeTarget, resetModeTarget, transactions, accounts } = useStore();

  const [isTuningOpen, setIsTuningOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - currentDay + 1);

  // Financial statistics for current month
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const income = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { monthlyIncome: income, monthlyExpense: expense };
  }, [transactions, currentYear, currentMonth]);

  const currentSettings = modeSettings[financialMode] || {
    savingRate: 20,
    defaultSavingRate: 20,
    minRate: 15,
    maxRate: 35,
  };

  const savingRate = currentSettings.savingRate;
  const expenseRate = 100 - savingRate;

  // Mode calculations
  const effectiveIncome = monthlyIncome > 0 ? monthlyIncome : accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const targetSavingsAmount = Math.round(effectiveIncome * (savingRate / 100));
  const maxExpenseAllowed = Math.max(0, effectiveIncome - targetSavingsAmount);
  const remainingAllowance = Math.max(0, maxExpenseAllowed - monthlyExpense);
  const dailySafeToSpend = Math.round(remainingAllowance / daysLeft);
  const burnPercentage = maxExpenseAllowed > 0 ? Math.min(100, Math.round((monthlyExpense / maxExpenseAllowed) * 100)) : 0;

  // Mode meta configuration
  const modeConfigs = {
    eco: {
      name: lang === 'bn' ? 'সঞ্চয় মোড' : 'Saver Mode',
      tagline: lang === 'bn' ? 'কঠোর সঞ্চয় ও নিয়ন্ত্রিত ব্যয়' : 'Disciplined savings & maximum wealth accumulation',
      badgeColor: '#207208',
      badgeBg: 'rgba(94, 210, 28, 0.16)',
      icon: Leaf,
      metricLabel: lang === 'bn' ? 'আজকের নিরাপদ ব্যয় সীমা' : 'Safe to Spend Today',
      metricSub: lang === 'bn' ? `চলতি মাসে আর ${daysLeft} দিন বাকি` : `${daysLeft} days remaining this month`,
      accentGradient: 'linear-gradient(135deg, rgba(94, 210, 28, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
      borderColor: 'rgba(94, 210, 28, 0.35)',
    },
    cruise: {
      name: lang === 'bn' ? 'ভারসাম্য মোড' : 'Balanced Mode',
      tagline: lang === 'bn' ? 'ভারসাম্যপূর্ণ জীবন ও নিয়ন্ত্রিত বাজেট' : 'Balanced lifestyle & predictable monthly budget pace',
      badgeColor: '#2563EB',
      badgeBg: 'rgba(59, 130, 246, 0.14)',
      icon: Scale,
      metricLabel: lang === 'bn' ? 'দৈনিক বাজেট গতি' : 'Daily Budget Pace',
      metricSub: lang === 'bn' ? 'স্বাভাবিক খরচের ভারসাম্য' : 'Optimal steady pacing',
      accentGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(99, 102, 241, 0.05) 100%)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    racing: {
      name: lang === 'bn' ? 'গ্রোথ মোড' : 'Growth Mode',
      tagline: lang === 'bn' ? 'ভবিষ্যতের মূলধন বিনিয়োগ ও সম্প্রসারণ' : 'Aggressive growth, capital expansion & investment',
      badgeColor: '#D97706',
      badgeBg: 'rgba(245, 158, 11, 0.18)',
      icon: Rocket,
      metricLabel: lang === 'bn' ? 'বাকি সম্প্রসারণ সক্ষমতা' : 'Expansion Capacity Remaining',
      metricSub: lang === 'bn' ? 'উচ্চগতির মূলধন বিনিয়োগ সক্রিয়' : 'Maximum capital velocity active',
      accentGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(239, 68, 68, 0.06) 100%)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
    },
  };

  const activeConfig = modeConfigs[financialMode] || modeConfigs.cruise;
  const ModeIcon = activeConfig.icon;

  return (
    <div
      className="card financial-mode-card animate-fade-in-up"
      data-tour="financial-mode"
      style={{
        marginBottom: 10,
        border: `1.5px solid ${activeConfig.borderColor}`,
        background: `var(--glass-bg-card)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Mode Switcher Tabs Header */}
      <div className="mode-tabs-header">
        <div className="mode-status-info">
          <div
            className="mode-icon-pill"
            style={{ backgroundColor: activeConfig.badgeBg, color: activeConfig.badgeColor }}
          >
            <ModeIcon size={16} />
            <span>{activeConfig.name}</span>
          </div>
          <span className="mode-tagline">{activeConfig.tagline}</span>
        </div>

        {/* Mode Selector Buttons */}
        <div className="mode-selector-pill-group">
          <button
            type="button"
            className={`mode-pill-btn eco ${financialMode === 'eco' ? 'active' : ''}`}
            onClick={() => setFinancialMode('eco')}
            title="Switch to Saver Mode"
          >
            <Leaf size={13} />
            <span>{lang === 'bn' ? 'সঞ্চয়' : 'Saver'}</span>
          </button>
          <button
            type="button"
            className={`mode-pill-btn cruise ${financialMode === 'cruise' ? 'active' : ''}`}
            onClick={() => setFinancialMode('cruise')}
            title="Switch to Balanced Mode"
          >
            <Scale size={13} />
            <span>{lang === 'bn' ? 'ভারসাম্য' : 'Balanced'}</span>
          </button>
          <button
            type="button"
            className={`mode-pill-btn racing ${financialMode === 'racing' ? 'active' : ''}`}
            onClick={() => setFinancialMode('racing')}
            title="Switch to Growth Mode"
          >
            <Rocket size={13} />
            <span>{lang === 'bn' ? 'গ্রোথ' : 'Growth'}</span>
          </button>
        </div>
      </div>

      {/* Mode Metrics Cockpit Grid */}
      <div className="mode-metrics-grid">
        {/* Left Column: Daily Safe Spend / Expansion */}
        <div className="mode-metric-box primary">
          <span className="metric-box-label">{activeConfig.metricLabel}</span>
          <div className="metric-box-val" style={{ color: activeConfig.badgeColor }}>
            {formatCurrency(financialMode === 'racing' ? remainingAllowance : dailySafeToSpend)}
          </div>
          <span className="metric-box-sub">{activeConfig.metricSub}</span>
        </div>

        {/* Center Column: Target Savings vs Spending */}
        <div className="mode-metric-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-box-label">{lang === 'bn' ? 'মাসিক লক্ষ্য' : 'Monthly Targets'}</span>
            <span className="metric-box-pct">{savingRate}% {lang === 'bn' ? 'সঞ্চয়' : 'Save'}</span>
          </div>
          <div className="mode-progress-bar-wrap">
            <div
              className="mode-progress-bar"
              style={{
                width: `${burnPercentage}%`,
                background:
                  financialMode === 'eco'
                    ? burnPercentage > 85 ? 'var(--color-expense)' : '#207208'
                    : financialMode === 'racing'
                    ? 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)'
                    : 'linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: 4, color: 'var(--color-text-tertiary)' }}>
            <span>{lang === 'bn' ? 'ব্যয়:' : 'Spent:'} {formatCurrency(monthlyExpense)}</span>
            <span>{lang === 'bn' ? 'সক্ষমতা:' : 'Cap:'} {formatCurrency(maxExpenseAllowed)}</span>
          </div>
        </div>

        {/* Right Column: Engine Tuning Button */}
        <div className="mode-metric-box tuning-action">
          <button
            type="button"
            className="btn btn-secondary btn-sm engine-tune-btn"
            onClick={() => setIsTuningOpen(!isTuningOpen)}
          >
            <Sliders size={14} />
            <span>{lang === 'bn' ? 'টিউনিং' : 'Tune Engine'}</span>
            {isTuningOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 4 }}>
            {lang === 'bn' ? 'লক্ষ্য পরিবর্তন করুন' : 'Calibrate percentages'}
          </span>
        </div>
      </div>

      {/* Expandable Engine Tuning Drawer */}
      {isTuningOpen && (
        <div className="engine-tuning-panel animate-fade-in-down">
          <div className="tuning-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color={activeConfig.badgeColor} />
              <span className="tuning-title">
                {lang === 'bn' ? `${activeConfig.name} টিউনিং ডেক` : `${activeConfig.name} Calibration Deck`}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm reset-default-btn"
              onClick={() => resetModeTarget(financialMode)}
              title="Reset to mode default"
            >
              <RotateCcw size={12} />
              <span>{lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset to Default'}</span>
            </button>
          </div>

          <div className="tuning-sliders-grid">
            {/* Savings Target Slider */}
            <div className="tuning-slider-wrap">
              <div className="slider-label-row">
                <span className="slider-name">{lang === 'bn' ? 'সঞ্চয় লক্ষ্য হার:' : 'Target Savings Rate:'}</span>
                <span className="slider-val" style={{ color: activeConfig.badgeColor }}>{savingRate}%</span>
              </div>
              <input
                type="range"
                min={currentSettings.minRate}
                max={currentSettings.maxRate}
                step={1}
                value={savingRate}
                onChange={(e) => updateModeTarget(financialMode, e.target.value)}
                className="mode-range-input"
                style={{ accentColor: activeConfig.badgeColor }}
              />
              <div className="slider-limits-row">
                <span>{lang === 'bn' ? 'সর্বনিম্ন:' : 'Min:'} {currentSettings.minRate}%</span>
                <span>{lang === 'bn' ? 'ডিফল্ট:' : 'Default:'} {currentSettings.defaultSavingRate}%</span>
                <span>{lang === 'bn' ? 'সর্বোচ্চ:' : 'Max:'} {currentSettings.maxRate}%</span>
              </div>
            </div>

            {/* Expense Allowance Auto-Balanced Slider */}
            <div className="tuning-slider-wrap">
              <div className="slider-label-row">
                <span className="slider-name">{lang === 'bn' ? 'ব্যয়/সম্প্রসারণ সীমা:' : 'Spending Expansion Allowance:'}</span>
                <span className="slider-val">{expenseRate}%</span>
              </div>
              <input
                type="range"
                min={100 - currentSettings.maxRate}
                max={100 - currentSettings.minRate}
                step={1}
                value={expenseRate}
                onChange={(e) => updateModeTarget(financialMode, 100 - Number(e.target.value))}
                className="mode-range-input"
              />
              <div className="slider-limits-row">
                <span>{lang === 'bn' ? 'সঞ্চয়ের সাথে স্বয়ংক্রিয় সমন্বিত' : 'Auto-balanced with savings rate (100%)'}</span>
              </div>
            </div>
          </div>

          {/* AI Mode Tip */}
          <div className="tuning-tip-bar">
            <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: activeConfig.badgeColor }} />
            <span>
              {financialMode === 'eco' &&
                (lang === 'bn'
                  ? `সঞ্চয় মোডে সঞ্চয় লক্ষ্য ${savingRate}% বজায় রাখলে চলতি মাসে ${formatCurrency(targetSavingsAmount)} সঞ্চয় নিশ্চিত হবে।`
                  : `In Saver Mode, maintaining a ${savingRate}% target locks ${formatCurrency(targetSavingsAmount)} into wealth generation.`)}
              {financialMode === 'cruise' &&
                (lang === 'bn'
                  ? `ভারসাম্য মোডে আপনি প্রতিদিন প্রায় ${formatCurrency(dailySafeToSpend)} খরচের সুষম গতি বজায় রাখতে পারেন।`
                  : `In Balanced Mode, your safe daily burn rate of ${formatCurrency(dailySafeToSpend)} gives a relaxed balance.`)}
              {financialMode === 'racing' &&
                (lang === 'bn'
                  ? `গ্রোথ মোডে মূলধন বিনিয়োগ ও সম্প্রসারণের সুযোগ সর্বোচ্চ করা হয়েছে। ব্যবসা ও নতুন আয়ের সুযোগে টাকা ব্যবহার করুন।`
                  : `In Growth Mode, income is prioritized for active capital deployment, business investment, and expansion.`)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
