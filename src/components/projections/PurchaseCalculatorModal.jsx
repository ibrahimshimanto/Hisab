import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/modalHelper.js';
import {
  X,
  Calculator,
  ShoppingBag,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function PurchaseCalculatorModal() {
  const { t, lang, formatCurrency } = useTranslation();
  const { calculatorModal, closeCalculatorModal, addSavingsGoal, profile, accounts } = useStore();

  const isOpen = calculatorModal.isOpen;

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

  const [itemName, setItemName] = useState('MacBook Pro M3');
  const [targetPrice, setTargetPrice] = useState('220000');
  const [downPayment, setDownPayment] = useState('40000');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Calculations
  const calcResults = useMemo(() => {
    const price = Number(targetPrice) || 0;
    const seed = Number(downPayment) || 0;
    const remainingToSave = Math.max(0, price - seed);

    if (!targetDate) {
      return { months: 1, days: 30, reqMonthly: remainingToSave, reqDaily: remainingToSave / 30, feasibility: 'easy' };
    }

    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target - now;
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const diffMonths = Math.max(1, Math.round(diffDays / 30.44));

    const reqMonthly = Math.round(remainingToSave / diffMonths);
    const reqDaily = Math.round(remainingToSave / diffDays);

    const salary = Number(profile?.monthlySalary || 60000);
    const pctOfIncome = salary > 0 ? (reqMonthly / salary) * 100 : 25;

    let feasibility = 'achievable';
    if (pctOfIncome <= 15) {
      feasibility = 'easy';
    } else if (pctOfIncome > 45) {
      feasibility = 'tight';
    }

    return {
      months: diffMonths,
      days: diffDays,
      remainingToSave,
      reqMonthly,
      reqDaily,
      pctOfIncome: Math.round(pctOfIncome),
      feasibility,
    };
  }, [targetPrice, downPayment, targetDate, profile?.monthlySalary]);

  if (!isOpen) return null;

  const handleSaveAsGoal = () => {
    addSavingsGoal({
      name: itemName.trim() || 'Purchase Goal',
      type: 'purchase',
      targetAmount: Number(targetPrice),
      currentAmount: Number(downPayment || 0),
      monthlyContribution: calcResults.reqMonthly,
      interestRate: 0,
      targetDate: new Date(targetDate).toISOString(),
      linkedAccountId: accounts[0]?.id || '',
      isLocked: false,
    });

    setCreatedSuccess(true);
    setTimeout(() => {
      setCreatedSuccess(false);
      closeCalculatorModal();
    }, 1200);
  };

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={closeCalculatorModal}>
      <div
        className="modal modal-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, borderRadius: '28px', border: 'none', boxShadow: 'none' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B5CF6',
              }}
            >
              <Calculator size={18} />
            </div>
            <div>
              <h2 className="modal-title">{t('calculator.title')}</h2>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                {t('calculator.subtitle')}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-icon btn-ghost btn-sm" onClick={closeCalculatorModal}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Item Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="calc-item-name">{t('calculator.itemName')}</label>
            <input
              id="calc-item-name"
              type="text"
              className="form-input"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={t('calculator.itemPlaceholder')}
              required
            />
          </div>

          {/* Price & Down Payment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-price">{t('calculator.targetPrice')}</label>
              <div className="input-with-icon">
                <span className="input-currency-prefix">৳</span>
                <input
                  id="calc-price"
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: 28, fontWeight: 'bold' }}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="220000"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="calc-seed">{t('calculator.downPayment')}</label>
              <div className="input-with-icon">
                <span className="input-currency-prefix">৳</span>
                <input
                  id="calc-seed"
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: 28 }}
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Target Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="calc-target-date">{t('calculator.targetDate')}</label>
            <input
              id="calc-target-date"
              type="date"
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          {/* Output Calculation Result Deck */}
          <div className="calculator-result-card">
            <div className="calc-res-grid">
              <div className="calc-res-box highlight">
                <span className="calc-res-label">{t('calculator.requiredMonthly')}</span>
                <span className="calc-res-val">{formatCurrency(calcResults.reqMonthly)}</span>
                <span className="calc-res-sub">
                  ~{formatCurrency(calcResults.reqDaily)} / {lang === 'bn' ? 'প্রতিদিন' : 'day'}
                </span>
              </div>

              <div className="calc-res-box">
                <span className="calc-res-label">{t('calculator.monthsRemaining')}</span>
                <span className="calc-res-val">{calcResults.months} {lang === 'bn' ? 'মাস' : 'Months'}</span>
                <span className="calc-res-sub">{calcResults.days} {lang === 'bn' ? 'দিন বাকি' : 'days left'}</span>
              </div>
            </div>

            {/* Feasibility Assessment Status */}
            <div className={`calc-feasibility-pill ${calcResults.feasibility}`}>
              {calcResults.feasibility === 'easy' && <Sparkles size={14} />}
              {calcResults.feasibility === 'achievable' && <CheckCircle2 size={14} />}
              {calcResults.feasibility === 'tight' && <AlertTriangle size={14} />}
              <span>
                {calcResults.feasibility === 'easy' && t('calculator.statusEasy')}
                {calcResults.feasibility === 'achievable' && t('calculator.statusAchievable')}
                {calcResults.feasibility === 'tight' && t('calculator.statusTight')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div
          className="modal-footer"
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderTop: 'none',
            background: 'var(--glass-bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={closeCalculatorModal}>
            {t('common.close')}
          </button>
          <button
            type="button"
            className="btn btn-lime"
            onClick={handleSaveAsGoal}
            disabled={createdSuccess || !targetPrice || Number(targetPrice) <= 0}
          >
            {createdSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>{t('calculator.savedSuccess')}</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>{t('calculator.saveAsGoal')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
