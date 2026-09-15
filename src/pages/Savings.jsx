import { useState, useMemo } from 'react';
import {
  Plus,
  Calculator,
  Lock,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Layers,
  CheckCircle2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import SavingsCard from '../components/savings/SavingsCard.jsx';
import ProjectionChart from '../components/projections/ProjectionChart.jsx';

export default function Savings() {
  const { t, lang, formatCurrency } = useTranslation();
  const {
    savingsGoals,
    openSavingsModal,
    openCalculatorModal,
  } = useStore();

  const [activeTab, setActiveTab] = useState('goals'); // 'goals' | 'projections'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'locked' | 'goals' | 'completed'

  // Summary Metrics
  const { totalAccumulated, totalLocked, totalEmergency, totalMonthlyPace } = useMemo(() => {
    let accumulated = 0;
    let locked = 0;
    let emergency = 0;
    let monthlyPace = 0;

    (savingsGoals || []).forEach((g) => {
      accumulated += g.currentAmount || 0;
      if (g.isLocked || g.type === 'fdr' || g.type === 'dps') {
        locked += g.currentAmount || 0;
      }
      if (g.type === 'emergency') {
        emergency += g.currentAmount || 0;
      }
      if (g.status === 'active' && g.monthlyContribution > 0) {
        monthlyPace += g.monthlyContribution || 0;
      }
    });

    return {
      totalAccumulated: accumulated,
      totalLocked: locked,
      totalEmergency: emergency,
      totalMonthlyPace: monthlyPace,
    };
  }, [savingsGoals]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return (savingsGoals || []).filter((g) => {
      if (filterType === 'locked') return g.isLocked || g.type === 'fdr' || g.type === 'dps';
      if (filterType === 'goals') return !g.isLocked && g.type !== 'fdr' && g.type !== 'dps' && g.status !== 'completed';
      if (filterType === 'completed') return g.status === 'completed' || (g.targetAmount && g.currentAmount >= g.targetAmount);
      return true; // all
    });
  }, [savingsGoals, filterType]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">{t('savings.title')}</h1>
          <p className="page-subtitle">{t('savings.subtitle')}</p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={() => openCalculatorModal()}
            title={t('savings.calculatePurchase')}
          >
            <Calculator size={15} />
            <span className="btn-text-full">{t('savings.calculatePurchase')}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm header-action-btn"
            onClick={() => openSavingsModal()}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="btn-text-full">{t('savings.newGoal')}</span>
            <span className="btn-text-short">{lang === 'bn' ? 'লক্ষ্য' : 'Goal'}</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Metric Cards Row */}
      <div className="savings-summary-grid" data-tour="savings-grid">
        {/* Total Accumulated */}
        <div className="savings-summary-box primary animate-fade-in-up">
          <div className="summary-box-top">
            <span className="summary-box-label">{t('savings.totalAccumulated')}</span>
            <div className="summary-box-icon lime">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="summary-box-val highlight">{formatCurrency(totalAccumulated)}</div>
          <div className="summary-box-sub">
            {savingsGoals.length} {lang === 'bn' ? 'সঞ্চয় স্কিম ও লক্ষ্য' : 'active savings schemes'}
          </div>
        </div>

        {/* Locked in DPS / FDR */}
        <div className="savings-summary-box animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="summary-box-top">
            <span className="summary-box-label">{t('savings.lockedFunds')}</span>
            <div className="summary-box-icon amber">
              <Lock size={16} />
            </div>
          </div>
          <div className="summary-box-val">{formatCurrency(totalLocked)}</div>
          <div className="summary-box-sub">
            {lang === 'bn' ? 'মেয়াদপূর্তি পর্যন্ত সুরক্ষিত' : 'Protected until maturity'}
          </div>
        </div>

        {/* Liquid Emergency Reserve */}
        <div className="savings-summary-box animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="summary-box-top">
            <span className="summary-box-label">{t('savings.liquidReserves')}</span>
            <div className="summary-box-icon emerald">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="summary-box-val">{formatCurrency(totalEmergency)}</div>
          <div className="summary-box-sub">
            {lang === 'bn' ? 'জরুরি প্রয়োজনে তাৎক্ষণিক প্রস্তুত' : 'Instantly accessible liquid buffer'}
          </div>
        </div>

        {/* Monthly Installment Pace */}
        <div className="savings-summary-box animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="summary-box-top">
            <span className="summary-box-label">{t('savings.monthlyContribution')}</span>
            <div className="summary-box-icon blue">
              <Calendar size={16} />
            </div>
          </div>
          <div className="summary-box-val">{formatCurrency(totalMonthlyPace)}/mo</div>
          <div className="summary-box-sub">
            {lang === 'bn' ? 'ধারাবাহিক ডিপিএস সঞ্চয়' : 'Monthly recurring discipline'}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="savings-tabs-header">
        <div className="savings-main-tabs">
          <button
            type="button"
            className={`savings-main-tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <Layers size={16} />
            <span>{t('savings.tabGoals')}</span>
            <span className="savings-tab-count">{savingsGoals.length}</span>
          </button>
          <button
            type="button"
            className={`savings-main-tab-btn ${activeTab === 'projections' ? 'active' : ''}`}
            onClick={() => setActiveTab('projections')}
          >
            <TrendingUp size={16} />
            <span>{t('savings.tabProjections')}</span>
          </button>
        </div>

        {/* Filter Pills (only when activeTab is goals) */}
        {activeTab === 'goals' && (
          <div className="savings-filter-pills">
            <button
              type="button"
              className={`savings-filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              {t('savings.filterAll')}
            </button>
            <button
              type="button"
              className={`savings-filter-pill ${filterType === 'locked' ? 'active' : ''}`}
              onClick={() => setFilterType('locked')}
            >
              {t('savings.filterLocked')}
            </button>
            <button
              type="button"
              className={`savings-filter-pill ${filterType === 'goals' ? 'active' : ''}`}
              onClick={() => setFilterType('goals')}
            >
              {t('savings.filterGoals')}
            </button>
            <button
              type="button"
              className={`savings-filter-pill ${filterType === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterType('completed')}
            >
              {t('savings.filterCompleted')}
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Goals & Schemes Grid */}
      {activeTab === 'goals' && (
        <>
          {filteredGoals.length > 0 ? (
            <div className="savings-cards-grid">
              {filteredGoals.map((goal) => (
                <SavingsCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="card empty-state-card animate-fade-in">
              <div className="empty-state-icon-wrap">
                <Target size={32} color="#5ED21C" />
              </div>
              <h3 className="empty-state-title">{t('savings.noGoals')}</h3>
              <p className="empty-state-desc">{t('savings.noGoalsDesc')}</p>
              <button
                type="button"
                className="btn btn-lime btn-sm empty-state-btn"
                onClick={() => openSavingsModal()}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>{t('savings.newGoal')}</span>
              </button>
            </div>
          )}

          {/* Bottom Purchase Planning Callout Card */}
          <div className="card purchase-callout-card animate-fade-in-up" style={{ marginTop: 'var(--space-6)' }}>
            <div className="purchase-callout-content">
              <div className="purchase-callout-icon">
                <Calculator size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 className="purchase-callout-title">{t('calculator.title')}</h3>
                <p className="purchase-callout-desc">{t('calculator.subtitle')}</p>
              </div>
            </div>
            <div className="purchase-callout-action">
              <button
                type="button"
                className="btn btn-lime btn-sm purchase-calc-cta"
                onClick={() => openCalculatorModal()}
                style={{ gap: 6 }}
              >
                <Calculator size={15} />
                <span>{t('savings.calculatePurchase')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Future Projections */}
      {activeTab === 'projections' && (
        <div className="savings-projections-container animate-fade-in">
          <ProjectionChart />
        </div>
      )}
    </div>
  );
}
