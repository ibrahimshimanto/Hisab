import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/modalHelper.js';
import { X, ArrowDownRight, ArrowUpRight, Wallet, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function SavingsDepositModal() {
  const { t, lang, formatCurrency } = useTranslation();
  const { depositModal, closeDepositModal, depositToSavingsGoal, withdrawFromSavingsGoal, accounts } = useStore();

  const isOpen = depositModal.isOpen;
  const goal = depositModal.goal;
  const mode = depositModal.mode || 'deposit'; // 'deposit' | 'withdraw'

  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    return goal?.linkedAccountId || accounts[0]?.id || '';
  });
  const [note, setNote] = useState('');

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

  if (!isOpen || !goal) return null;

  const isDeposit = mode === 'deposit';

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (isDeposit) {
      depositToSavingsGoal(goal.id, numAmount, selectedAccountId, note);
    } else {
      withdrawFromSavingsGoal(goal.id, numAmount, selectedAccountId, note);
    }

    closeDepositModal();
    setAmount('');
    setNote('');
  };

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={closeDepositModal}>
      <div
        className="modal modal-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440, borderRadius: 'var(--radius-2xl)' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-lg)',
                background: isDeposit
                  ? 'rgba(94, 210, 28, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
                color: isDeposit ? '#207208' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDeposit ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h2 className="modal-title">
                {isDeposit
                  ? (lang === 'bn' ? 'টাকা জমা করুন' : 'Add Deposit')
                  : (lang === 'bn' ? 'টাকা উত্তোলন করুন' : 'Withdraw Funds')}
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                {goal.name} • {t('savings.currentAmount')}: {formatCurrency(goal.currentAmount)}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-icon btn-ghost btn-sm" onClick={closeDepositModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Amount input */}
          <div className="form-group">
            <label className="form-label" htmlFor="deposit-amount">
              {isDeposit
                ? (lang === 'bn' ? 'জমার পরিমাণ (৳)' : 'Deposit Amount (৳)')
                : (lang === 'bn' ? 'উত্তোলনের পরিমাণ (৳)' : 'Withdrawal Amount (৳)')}
            </label>
            <div className="input-with-icon">
              <span className="input-currency-prefix">৳</span>
              <input
                id="deposit-amount"
                type="number"
                className="form-input"
                style={{ paddingLeft: 28, fontSize: '1.25rem', fontWeight: 'bold' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                min="1"
                max={!isDeposit ? goal.currentAmount : undefined}
                required
                autoFocus
              />
            </div>
            {!isDeposit && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                <span>{lang === 'bn' ? 'সর্বোচ্চ উপলব্ধ:' : 'Available balance:'} {formatCurrency(goal.currentAmount)}</span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => setAmount(goal.currentAmount.toString())}
                >
                  {lang === 'bn' ? 'সম্পূর্ণ তুলুন' : 'Max All'}
                </button>
              </div>
            )}
          </div>

          {/* Account Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="deposit-account">
              {isDeposit
                ? (lang === 'bn' ? 'উৎস অ্যাকাউন্ট (টাকা কাটা হবে)' : 'From Account (Balance deducted)')
                : (lang === 'bn' ? 'গন্তব্য অ্যাকাউন্ট (টাকা জমা হবে)' : 'To Account (Balance credited)')}
            </label>
            <select
              id="deposit-account"
              className="form-input form-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Note Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="deposit-note">
              {lang === 'bn' ? 'মন্তব্য (ঐচ্ছিক)' : 'Note (Optional)'}
            </label>
            <input
              id="deposit-note"
              type="text"
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isDeposit ? 'Monthly installment' : 'Maturity redemption'}
            />
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ padding: 0, marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={closeDepositModal}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={`btn ${isDeposit ? 'btn-lime' : 'btn-primary'}`}
              disabled={!amount || Number(amount) <= 0}
            >
              {isDeposit
                ? (lang === 'bn' ? 'জমা নিশ্চিত করুন' : 'Confirm Deposit')
                : (lang === 'bn' ? 'উত্তোলন নিশ্চিত করুন' : 'Confirm Withdrawal')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
