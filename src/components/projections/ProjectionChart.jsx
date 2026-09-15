import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, ShieldCheck, Zap, Sparkles, Compass, Flame, Leaf } from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProjectionChart() {
  const { t, lang, formatCurrency } = useTranslation();
  const {
    accounts,
    transactions,
    profile,
    financialMode,
    modeSettings,
    savingsGoals,
  } = useStore();

  const [horizon, setHorizon] = useState(6); // 3, 6, 12 months

  // 1. Current Total Net Worth (Liquid Accounts + Locked / Accumulated Savings)
  const currentLiquid = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  }, [accounts]);

  const currentSavings = useMemo(() => {
    return (savingsGoals || []).reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [savingsGoals]);

  const totalCurrentNetWorth = currentLiquid + currentSavings;

  // 2. Average Monthly Cashflow
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const salary = Number(profile?.monthlySalary || 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const inc = thisMonthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const exp = thisMonthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const baseIncome = Math.max(salary, inc, 45000); // realistic default fallback
    const baseExpense = exp > 0 ? exp : baseIncome * 0.7;

    return { monthlyIncome: baseIncome, monthlyExpense: baseExpense };
  }, [profile?.monthlySalary, transactions]);

  // 3. Monthly DPS & Recurring Interest
  const recurringMonthlyDPS = useMemo(() => {
    return (savingsGoals || [])
      .filter((g) => g.status === 'active' && g.monthlyContribution > 0)
      .reduce((sum, g) => sum + g.monthlyContribution, 0);
  }, [savingsGoals]);

  // 4. Generate Simulation Data Points for Eco, Cruise, and Racing modes
  const simulation = useMemo(() => {
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

    const labels = [lang === 'bn' ? 'বর্তমান' : 'Today'];
    const ecoPoints = [totalCurrentNetWorth];
    const cruisePoints = [totalCurrentNetWorth];
    const racingPoints = [totalCurrentNetWorth];

    const now = new Date();

    const ecoRate = (modeSettings?.eco?.savingRate || 40) / 100;
    const cruiseRate = (modeSettings?.cruise?.savingRate || 20) / 100;
    const racingRate = (modeSettings?.racing?.savingRate || 5) / 100;

    let runningEco = totalCurrentNetWorth;
    let runningCruise = totalCurrentNetWorth;
    let runningRacing = totalCurrentNetWorth;

    for (let i = 1; i <= horizon; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mIdx = futureDate.getMonth();
      const labelStr = lang === 'bn' ? monthNamesBn[mIdx] : monthNamesEn[mIdx];
      labels.push(`+${i}m (${labelStr})`);

      // Savings accumulation per mode
      const ecoMonthlySaved = monthlyIncome * ecoRate + (recurringMonthlyDPS * 0.5);
      const cruiseMonthlySaved = monthlyIncome * cruiseRate + (recurringMonthlyDPS * 0.3);
      const racingMonthlySaved = monthlyIncome * racingRate;

      runningEco += ecoMonthlySaved;
      runningCruise += cruiseMonthlySaved;
      runningRacing += racingMonthlySaved;

      ecoPoints.push(Math.round(runningEco));
      cruisePoints.push(Math.round(runningCruise));
      racingPoints.push(Math.round(runningRacing));
    }

    return { labels, ecoPoints, cruisePoints, racingPoints };
  }, [totalCurrentNetWorth, monthlyIncome, recurringMonthlyDPS, horizon, modeSettings, lang]);

  // Active Selected Mode Projected Net Worth at horizon
  const projectedNetWorth = useMemo(() => {
    const endIdx = simulation.labels.length - 1;
    if (financialMode === 'eco') return simulation.ecoPoints[endIdx];
    if (financialMode === 'racing') return simulation.racingPoints[endIdx];
    return simulation.cruisePoints[endIdx];
  }, [simulation, financialMode]);

  const netExpectedGrowth = projectedNetWorth - totalCurrentNetWorth;

  // ChartJS Datasets & Options
  const chartData = {
    labels: simulation.labels,
    datasets: [
      {
        label: t('projections.optimistic'),
        data: simulation.ecoPoints,
        borderColor: '#5ED21C',
        backgroundColor: 'rgba(94, 210, 28, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: financialMode === 'eco' ? 3.5 : 2,
        pointBackgroundColor: '#5ED21C',
        pointBorderColor: '#111411',
        pointRadius: financialMode === 'eco' ? 4 : 2,
        pointHoverRadius: 6,
      },
      {
        label: t('projections.expected'),
        data: simulation.cruisePoints,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.04)',
        fill: true,
        tension: 0.35,
        borderWidth: financialMode === 'cruise' ? 3.5 : 2,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#FFFFFF',
        pointRadius: financialMode === 'cruise' ? 4 : 2,
        pointHoverRadius: 6,
      },
      {
        label: t('projections.conservative'),
        data: simulation.racingPoints,
        borderColor: '#D97706',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.35,
        borderWidth: financialMode === 'racing' ? 3.5 : 2,
        pointBackgroundColor: '#D97706',
        pointRadius: financialMode === 'racing' ? 4 : 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 'bold' },
          color: '#64748B',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 20, 17, 0.92)',
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 'bold' },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          color: '#94A3B8',
        },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [3, 3] },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
          color: '#94A3B8',
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <div className="card projection-card animate-fade-in-up">
      {/* Top Header Row */}
      <div className="projection-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="card-title" style={{ margin: 0 }}>{t('projections.title')}</h2>
            <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
              AI Engine
            </span>
          </div>
          <p className="card-subtitle" style={{ margin: '4px 0 0' }}>{t('projections.subtitle')}</p>
        </div>

        {/* Horizon Switcher Pills */}
        <div className="projection-horizon-pills">
          <button
            type="button"
            className={`horizon-pill-btn ${horizon === 3 ? 'active' : ''}`}
            onClick={() => setHorizon(3)}
          >
            {t('projections.horizon3m')}
          </button>
          <button
            type="button"
            className={`horizon-pill-btn ${horizon === 6 ? 'active' : ''}`}
            onClick={() => setHorizon(6)}
          >
            {t('projections.horizon6m')}
          </button>
          <button
            type="button"
            className={`horizon-pill-btn ${horizon === 12 ? 'active' : ''}`}
            onClick={() => setHorizon(12)}
          >
            {t('projections.horizon12m')}
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="projection-metrics-grid">
        <div className="proj-metric-box">
          <span className="proj-metric-label">{t('projections.currentNetWorth')}</span>
          <span className="proj-metric-val">{formatCurrency(totalCurrentNetWorth)}</span>
          <span className="proj-metric-sub">
            {accounts.length} {lang === 'bn' ? 'অ্যাকাউন্ট' : 'accounts'} + {savingsGoals.length} {lang === 'bn' ? 'স্কিম' : 'goals'}
          </span>
        </div>

        <div className="proj-metric-box primary">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="proj-metric-label">{t('projections.projectedBalance')} ({horizon}m)</span>
            <span className={`mode-badge-pill ${financialMode}`}>
              {financialMode === 'eco' && <Leaf size={10} />}
              {financialMode === 'cruise' && <Compass size={10} />}
              {financialMode === 'racing' && <Flame size={10} />}
              <span>{financialMode.toUpperCase()}</span>
            </span>
          </div>
          <span className="proj-metric-val highlight">{formatCurrency(projectedNetWorth)}</span>
          <span className="proj-metric-sub green">
            +{formatCurrency(netExpectedGrowth)} {t('projections.expectedGrowth')}
          </span>
        </div>

        <div className="proj-metric-box">
          <span className="proj-metric-label">{t('savings.monthlyContribution')}</span>
          <span className="proj-metric-val">{formatCurrency(recurringMonthlyDPS)}/mo</span>
          <span className="proj-metric-sub">
            {lang === 'bn' ? 'সঞ্চয় কিস্তি প্রতি মাসে' : 'Active locked schemes'}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="projection-canvas-wrap">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Footnote Notice */}
      <div className="projection-footer-note">
        <Sparkles size={13} color="#5ED21C" style={{ flexShrink: 0 }} />
        <span>{t('projections.modeNotice')}</span>
      </div>
    </div>
  );
}
