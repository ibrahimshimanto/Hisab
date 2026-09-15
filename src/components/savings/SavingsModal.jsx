import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/modalHelper.js';
import {
  X,
  Lock,
  Unlock,
  TrendingUp,
  ShieldCheck,
  Target,
  ShoppingBag,
  Sparkles,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function SavingsModal() {
  const { t, lang } = useTranslation();
  const { savingsModal, closeSavingsModal, addSavingsGoal, updateSavingsGoal, accounts } = useStore();

  const isOpen = savingsModal.isOpen;
  const editGoal = savingsModal.editGoal;

  const [name, setName] = useState('');
  const [type, setType] = useState('dps');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setName(editGoal.name || '');
      setType(editGoal.type || 'dps');
      setTargetAmount(editGoal.targetAmount?.toString() || '');
      setCurrentAmount(editGoal.currentAmount?.toString() || '');
      setMonthlyContribution(editGoal.monthlyContribution?.toString() || '');
      setInterestRate(editGoal.interestRate?.toString() || '');
      setTargetDate(editGoal.targetDate ? editGoal.targetDate.split('T')[0] : '');
      setLinkedAccountId(editGoal.linkedAccountId || '');
      setIsLocked(!!editGoal.isLocked);
    } else {
      setName('');
      setType('dps');
      setTargetAmount('');
      setCurrentAmount('');
      setMonthlyContribution('');
      setInterestRate('');
      // Default 1 year from now
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setTargetDate(d.toISOString().split('T')[0]);
      setLinkedAccountId(accounts[0]?.id || '');
      setIsLocked(true);
    }
  }, [editGoal, accounts, isOpen]);

  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    }
    return () => {
      if (isOpen) {
        unlockBodyScroll();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    const goalData = {
      name: name.trim(),
      type,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount || 0),
      monthlyContribution: Number(monthlyContribution || 0),
      interestRate: Number(interestRate || 0),
      targetDate: targetDate ? new Date(targetDate).toISOString() : '',
      startDate: editGoal?.startDate || new Date().toISOString(),
      linkedAccountId,
      isLocked: isLocked || type === 'fdr' || type === 'dps',
    };

    if (editGoal) {
      updateSavingsGoal(editGoal.id, goalData);
    } else {
      addSavingsGoal(goalData);
    }

    closeSavingsModal();
  };

  const schemeTypes = [
    { key: 'dps', label: lang === 'bn' ? 'ডিপিএস' : 'DPS Scheme', icon: TrendingUp },
    { key: 'fdr', label: lang === 'bn' ? 'এফডিআর' : 'Fixed FDR', icon: Lock },
    { key: 'emergency', label: lang === 'bn' ? 'জরুরি ফান্ড' : 'Emergency', icon: ShieldCheck },
    { key: 'purchase', label: lang === 'bn' ? 'ক্রয় লক্ষ্য' : 'Purchase', icon: ShoppingBag },
    { key: 'custom', label: lang === 'bn' ? 'অন্যান্য' : 'Custom Goal', icon: Target },
  ];

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={closeSavingsModal}>
      <div
        className="modal modal-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, borderRadius: 'var(--radius-2xl)' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(94, 210, 28, 0.2), rgba(94, 210, 28, 0.05))',
                border: '1px solid rgba(94, 210, 28, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5ED21C',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="modal-title">
                {editGoal
                  ? (lang === 'bn' ? 'স্কিম সম্পাদনা' : 'Edit Savings Scheme')
                  : (lang === 'bn' ? 'নতুন সঞ্চয় স্কিম' : 'New Savings Scheme')}
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                {lang === 'bn' ? 'ডিপিএস, এফডিআর বা সঞ্চয় লক্ষ্য যুক্ত করুন' : 'Create a DPS, FDR, or financial milestone'}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-icon btn-ghost btn-sm" onClick={closeSavingsModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Scheme Type Selector */}
          <div>
            <label className="form-label">{t('savings.goalType')}</label>
            <div className="scheme-type-grid">
              {schemeTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`scheme-type-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setType(item.key);
                      if (item.key === 'fdr' || item.key === 'dps') {
                        setIsLocked(true);
                      }
                    }}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scheme Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="goal-name">{t('savings.goalName')}</label>
            <input
              id="goal-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: বিকাশ ৪-বছর ডিপিএস, ল্যাপটপ ক্রয়' : 'e.g. bKash 4-Year DPS, MacBook Pro M3'}
              required
            />
          </div>

          {/* Amount Row: Target & Initial */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="target-amount">{t('savings.targetAmount')}</label>
              <div className="input-with-icon">
                <span className="input-currency-prefix">৳</span>
                <input
                  id="target-amount"
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: 28 }}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="100000"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="current-amount">{t('savings.currentAmount')}</label>
              <div className="input-with-icon">
                <span className="input-currency-prefix">৳</span>
                <input
                  id="current-amount"
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: 28 }}
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Recurring Installment & Return Rate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="monthly-contribution">
                {t('savings.monthlyContribution')}
              </label>
              <div className="input-with-icon">
                <span className="input-currency-prefix">৳</span>
                <input
                  id="monthly-contribution"
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: 28 }}
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder="5000"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="interest-rate">
                {t('savings.interestRate')} (%)
              </label>
              <input
                id="interest-rate"
                type="number"
                step="0.1"
                className="form-input"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="7.5"
                min="0"
              />
            </div>
          </div>

          {/* Target Date & Linked Account */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="target-date">{t('savings.targetDate')}</label>
              <input
                id="target-date"
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="linked-account">{t('savings.linkedAccount')}</label>
              <select
                id="linked-account"
                className="form-input form-select"
                value={linkedAccountId}
                onChange={(e) => setLinkedAccountId(e.target.value)}
              >
                <option value="">{lang === 'bn' ? '-- অ্যাকাউন্ট বাছাই করুন --' : '-- Select Account --'}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (৳{acc.balance?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Maturity Lock Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              background: isLocked ? 'rgba(217, 119, 6, 0.08)' : 'var(--glass-bg-subtle)',
              border: isLocked ? '1px solid rgba(217, 119, 6, 0.28)' : '1px solid var(--glass-border-subtle)',
              cursor: 'pointer',
            }}
            onClick={() => setIsLocked(!isLocked)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: isLocked ? '#D97706' : 'var(--color-text-tertiary)' }}>
                {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                  {t('savings.lockProtection')}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                  {t('savings.lockProtectionDesc')}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              style={{ cursor: 'pointer', width: 16, height: 16 }}
            />
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ marginTop: 8, padding: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={closeSavingsModal}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-lime">
              {editGoal ? t('common.save') : (lang === 'bn' ? 'স্কিম সংরক্ষণ করুন' : 'Create Scheme')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
