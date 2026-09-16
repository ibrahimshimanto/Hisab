import { useMemo } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  Target,
  ShoppingBag,
  Clock,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  Percent,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function SavingsCard({ goal }) {
  const { t, lang, formatCurrency, formatDate } = useTranslation();
  const { openDepositModal, openSavingsModal, deleteSavingsGoal, accounts } = useStore();

  const linkedAccount = useMemo(() => {
    return accounts.find((a) => a.id === goal.linkedAccountId);
  }, [accounts, goal.linkedAccountId]);

  // Days & Completion calculation
  const { daysRemaining, isMatured, timeLabel } = useMemo(() => {
    if (goal.targetDate) {
      const now = new Date();
      const target = new Date(goal.targetDate);
      const diffTime = target - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        return { daysRemaining: 0, isMatured: true, timeLabel: t('savings.matured') };
      }
      return {
        daysRemaining: diffDays,
        isMatured: false,
        timeLabel: `${diffDays} ${t('savings.daysLeft')}`,
      };
    }

    // If no explicit target date, estimate from monthly pace if available
    if (goal.monthlyContribution > 0 && goal.targetAmount > (goal.currentAmount || 0)) {
      const remaining = goal.targetAmount - (goal.currentAmount || 0);
      const months = Math.ceil(remaining / goal.monthlyContribution);
      return {
        daysRemaining: months * 30,
        isMatured: false,
        timeLabel: lang === 'bn' ? `আর ${months.toLocaleString('bn-BD')} মাস বাকি` : `${months} mo. remaining`,
      };
    }

    return { daysRemaining: 0, isMatured: false, timeLabel: '' };
  }, [goal.targetDate, goal.monthlyContribution, goal.targetAmount, goal.currentAmount, lang, t]);

  // Progress percentage
  const pct = useMemo(() => {
    if (!goal.targetAmount || goal.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }, [goal.currentAmount, goal.targetAmount]);

  // Type metadata
  const typeConfig = useMemo(() => {
    switch (goal.type) {
      case 'dps':
        return {
          icon: TrendingUp,
          label: lang === 'bn' ? 'ডিপিএস স্কিম' : 'Recurring DPS',
          color: '#2563EB',
          bg: 'rgba(37, 99, 235, 0.12)',
          border: 'rgba(37, 99, 235, 0.28)',
        };
      case 'fdr':
        return {
          icon: Lock,
          label: lang === 'bn' ? 'স্থায়ী আমানত (FDR)' : 'Fixed Deposit (FDR)',
          color: '#D97706',
          bg: 'rgba(217, 119, 6, 0.12)',
          border: 'rgba(217, 119, 6, 0.28)',
        };
      case 'emergency':
        return {
          icon: ShieldCheck,
          label: lang === 'bn' ? 'জরুরি রিজার্ভ' : 'Emergency Fund',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.28)',
        };
      case 'purchase':
        return {
          icon: ShoppingBag,
          label: lang === 'bn' ? 'ক্রয় লক্ষ্য' : 'Purchase Goal',
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.12)',
          border: 'rgba(139, 92, 246, 0.28)',
        };
      default:
        return {
          icon: Target,
          label: lang === 'bn' ? 'সঞ্চয় লক্ষ্য' : 'Savings Goal',
          color: '#5ED21C',
          bg: 'rgba(94, 210, 28, 0.12)',
          border: 'rgba(94, 210, 28, 0.28)',
        };
    }
  }, [goal.type, lang]);

  const TypeIcon = typeConfig.icon;

  // Accrued profit projection (simple compound estimate)
  const accruedInterest = useMemo(() => {
    if (!goal.interestRate || goal.interestRate <= 0) return 0;
    const start = new Date(goal.startDate || '2024-01-01');
    const now = new Date();
    const months = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
    return Math.round((goal.currentAmount * (goal.interestRate / 100) * (months / 12)));
  }, [goal.interestRate, goal.startDate, goal.currentAmount]);

  const handleDelete = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি এই সঞ্চয় স্কিমটি মুছে ফেলতে চান?' : 'Are you sure you want to remove this savings goal?')) {
      deleteSavingsGoal(goal.id);
    }
  };

  return (
    <div className={`savings-card ${goal.isLocked && !isMatured ? 'locked' : ''} animate-fade-in-up`}>
      {/* Top Header */}
      <div className="savings-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            className="savings-card-type-pill"
            style={{
              backgroundColor: typeConfig.bg,
              borderColor: typeConfig.border,
              color: typeConfig.color,
            }}
          >
            <TypeIcon size={12} strokeWidth={2.5} />
            <span>{typeConfig.label}</span>
          </div>

          {goal.isLocked && (
            <span
              className={`savings-lock-status-badge ${isMatured ? 'matured' : 'locked'}`}
              title={isMatured ? t('savings.matured') : t('savings.lockProtectionDesc')}
            >
              {isMatured ? <Unlock size={10} /> : <Lock size={10} />}
              <span>{isMatured ? t('savings.matured') : t('savings.locked')}</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            type="button"
            className="btn btn-icon btn-ghost btn-sm"
            onClick={() => openSavingsModal(goal)}
            title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit Scheme'}
            style={{ width: 28, height: 28 }}
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-ghost btn-sm"
            onClick={handleDelete}
            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete Scheme'}
            style={{ width: 28, height: 28, color: 'var(--color-expense)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Goal Title & Target */}
      <div className="savings-card-title-wrap">
        <h3 className="savings-card-name" title={goal.name}>{goal.name}</h3>
        {linkedAccount && (
          <div className="savings-card-account-tag">
            <span>{linkedAccount.name}</span>
          </div>
        )}
      </div>

      {/* Main Numbers: Current & Target */}
      <div className="savings-balance-deck">
        <div>
          <div className="savings-balance-label">{t('savings.currentAmount')}</div>
          <div className="savings-balance-figure">{formatCurrency(goal.currentAmount)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="savings-balance-label">{t('savings.targetAmount')}</div>
          <div className="savings-target-figure">{formatCurrency(goal.targetAmount)}</div>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="savings-progress-wrap">
        <div className="savings-progress-info">
          <span className="savings-pct-text">{pct}% {t('savings.completed')}</span>
          {timeLabel && (
            <span className="savings-countdown-text">
              <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              {timeLabel}
            </span>
          )}
        </div>
        <div className="savings-track">
          <div
            className="savings-fill"
            style={{
              width: `${pct}%`,
              background: isMatured
                ? 'linear-gradient(90deg, #10B981, #5ED21C)'
                : goal.type === 'fdr'
                ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                : 'linear-gradient(90deg, #5ED21C, #22C55E)',
            }}
          />
        </div>
      </div>

      {/* Supplementary Financial Stats Row */}
      <div className="savings-stats-pills">
        {goal.monthlyContribution > 0 && (
          <div className="savings-stat-pill">
            <Calendar size={11} />
            <span>{formatCurrency(goal.monthlyContribution)}/mo</span>
          </div>
        )}
        {goal.interestRate > 0 && (
          <div className="savings-stat-pill rate">
            <Percent size={11} />
            <span>{goal.interestRate}% return</span>
          </div>
        )}
        {accruedInterest > 0 && (
          <div className="savings-stat-pill profit" title={t('savings.accruedInterest')}>
            <Sparkles size={11} />
            <span>+{formatCurrency(accruedInterest)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Row (Single Deposit CTA is full width and center aligned) */}
      <div className={`savings-card-actions ${(!goal.isLocked || isMatured) ? 'dual-actions' : 'single-action'}`}>
        <button
          type="button"
          className="btn btn-sm btn-lime savings-action-btn"
          onClick={() => openDepositModal(goal, 'deposit')}
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>{t('savings.deposit')}</span>
        </button>

        {(!goal.isLocked || isMatured) && (
          <button
            type="button"
            className="btn btn-sm btn-ghost savings-action-btn"
            onClick={() => openDepositModal(goal, 'withdraw')}
            disabled={goal.currentAmount <= 0}
          >
            <ArrowUpRight size={14} />
            <span>{t('savings.withdraw')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
