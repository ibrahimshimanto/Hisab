import { useState, useMemo } from 'react';
import {
  Calendar, CheckCircle2, AlertCircle, Clock, Plus,
  Edit2, Trash2, Check, ArrowRight, ShieldAlert,
  Wallet, Sparkles, RefreshCw
} from 'lucide-react';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';
import Modal from '../ui/Modal.jsx';

const PRESET_ICONS = ['🏠', '⚡', '🌐', '🎬', '🏋️', '📚', '🩺', '💳', '🚗', '🛡️', '📱', '💼', '🛒', '🎓'];

export default function RecurringBillsSection({ title, subtitle, showCardWrapper = true }) {
  const { t, lang, formatCurrency } = useTranslation();
  const {
    recurringBills = [],
    accounts = [],
    categories,
    transactions = [],
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    payRecurringBill,
    toggleRecurringBillPaid,
  } = useStore();

  const [filter, setFilter] = useState('all'); // 'all' | 'unpaid' | 'paid'
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDay, setFormDueDay] = useState('5');
  const [formCategoryId, setFormCategoryId] = useState('utilities');
  const [formAccountId, setFormAccountId] = useState('');
  const [formIcon, setFormIcon] = useState('🏠');

  // Form State for Pay Modal
  const [payAccountId, setPayAccountId] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payAmount, setPayAmount] = useState('');
  const [payWithoutTxn, setPayWithoutTxn] = useState(false);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDay = today.getDate();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Month Name
  const monthName = today.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });

  // Compute status for each bill
  const billsWithStatus = useMemo(() => {
    return recurringBills.map((bill) => {
      // 1. Check paidMonths
      const inPaidMonths = Array.isArray(bill.paidMonths) && bill.paidMonths.includes(currentMonthKey);

      // 2. Check matching transactions in current month
      const matchingTxn = transactions.find((txn) => {
        if (txn.type !== 'expense' || !txn.date || !txn.date.startsWith(currentMonthKey)) return false;
        if (txn.recurringBillId === bill.id) return true;
        // Approximate description match
        if (txn.description && bill.name && txn.description.toLowerCase().includes(bill.name.toLowerCase())) {
          return Math.abs((Number(txn.amount) || 0) - (Number(bill.amount) || 0)) <= 2;
        }
        return false;
      });

      const isPaid = inPaidMonths || Boolean(matchingTxn);

      // Due calculation
      const dueDay = Number(bill.dueDay) || 1;
      let status = 'upcoming'; // 'paid' | 'today' | 'dueSoon' | 'overdue' | 'upcoming'
      let diffDays = dueDay - currentDay;

      if (isPaid) {
        status = 'paid';
      } else if (diffDays === 0) {
        status = 'today';
      } else if (diffDays < 0) {
        status = 'overdue';
      } else if (diffDays <= 4) {
        status = 'dueSoon';
      } else {
        status = 'upcoming';
      }

      return {
        ...bill,
        isPaid,
        status,
        diffDays,
      };
    });
  }, [recurringBills, transactions, currentMonthKey, currentDay]);

  // Metric Aggregates
  const totalMonthlyCommitment = useMemo(() => {
    return billsWithStatus.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [billsWithStatus]);

  const totalPaidAmount = useMemo(() => {
    return billsWithStatus
      .filter((b) => b.isPaid)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [billsWithStatus]);

  const paidCount = billsWithStatus.filter((b) => b.isPaid).length;
  const totalCount = billsWithStatus.length;
  const progressPct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  // Filtered Bills
  const filteredBills = useMemo(() => {
    if (filter === 'paid') return billsWithStatus.filter((b) => b.isPaid);
    if (filter === 'unpaid') return billsWithStatus.filter((b) => !b.isPaid);
    return billsWithStatus;
  }, [billsWithStatus, filter]);

  // Handlers for Add/Edit
  const openAddBillModal = () => {
    setEditingBill(null);
    setFormName('');
    setFormAmount('');
    setFormDueDay('5');
    setFormCategoryId('utilities');
    setFormAccountId(accounts[0]?.id || '');
    setFormIcon('🏠');
    setBillModalOpen(true);
  };

  const openEditBillModal = (bill) => {
    setEditingBill(bill);
    setFormName(bill.name || '');
    setFormAmount(String(bill.amount || ''));
    setFormDueDay(String(bill.dueDay || '5'));
    setFormCategoryId(bill.categoryId || 'utilities');
    setFormAccountId(bill.accountId || accounts[0]?.id || '');
    setFormIcon(bill.icon || '🏠');
    setBillModalOpen(true);
  };

  const handleSaveBill = (e) => {
    if (e) e.preventDefault();
    if (!formName.trim() || !formAmount) return;

    const data = {
      name: formName.trim(),
      amount: Number(formAmount),
      dueDay: Math.min(31, Math.max(1, Number(formDueDay) || 1)),
      categoryId: formCategoryId,
      accountId: formAccountId,
      icon: formIcon,
    };

    if (editingBill) {
      updateRecurringBill(editingBill.id, data);
    } else {
      addRecurringBill(data);
    }

    setBillModalOpen(false);
  };

  // Handlers for Paying
  const openPayModal = (bill) => {
    setPayingBill(bill);
    setPayAmount(String(bill.amount || ''));
    setPayAccountId(bill.accountId || accounts[0]?.id || '');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayWithoutTxn(false);
    setPayModalOpen(true);
  };

  const handleConfirmPayment = (e) => {
    if (e) e.preventDefault();
    if (!payingBill) return;

    if (payWithoutTxn) {
      toggleRecurringBillPaid(payingBill.id, currentMonthKey);
    } else {
      payRecurringBill(payingBill.id, {
        accountId: payAccountId || payingBill.accountId,
        date: payDate,
        amount: Number(payAmount) || payingBill.amount,
        note: `${payingBill.name} (${monthName})`,
      });
    }

    setPayModalOpen(false);
    setPayingBill(null);
  };

  const handleToggleUnpaid = (billId) => {
    toggleRecurringBillPaid(billId, currentMonthKey);
  };

  const content = (
    <div className="recurring-manager-wrap">
      {/* Header with Title & Action */}
      <div className="recurring-section-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(94, 210, 28, 0.2), rgba(94, 210, 28, 0.05))',
            border: '1px solid rgba(94, 210, 28, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5ED21C',
            flexShrink: 0,
          }}>
            <RefreshCw size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: 'var(--text-base)' }}>
                {title || (lang === 'bn' ? 'মাসিক নিয়মিত বিল ও ব্যয়' : 'Monthly Recurring Expenses')}
              </h3>
              <span style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 'var(--weight-bold)',
                background: progressPct === 100 ? 'rgba(16, 185, 129, 0.16)' : 'rgba(94, 210, 28, 0.16)',
                color: progressPct === 100 ? 'var(--color-income)' : 'var(--color-primary-dark)',
                whiteSpace: 'nowrap',
              }}>
                {paidCount} / {totalCount} {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
              </span>
            </div>
            <p className="card-subtitle" style={{ margin: '3px 0 0', fontSize: '12px' }}>
              {subtitle || (lang === 'bn' ? `${monthName} এর জন্য নিয়মিত প্রতিশ্রুতির অবস্থা` : `Payment status & fixed commitments for ${monthName}`)}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-lime"
          onClick={openAddBillModal}
          style={{ gap: 6, flexShrink: 0, height: 36, padding: '0 12px', whiteSpace: 'nowrap' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>{lang === 'bn' ? 'নিয়মিত বিল যোগ' : 'Add Bill'}</span>
        </button>
      </div>

      {/* Progress & Summary Bar (Optimized Data Layer) */}
      <div style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface-secondary)',
        border: '1px solid var(--color-border)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span>{lang === 'bn' ? 'চলতি মাসে পরিশোধিত:' : 'Paid so far this month:'}</span>{' '}
            <strong style={{ color: 'var(--color-primary-dark)', fontWeight: 'var(--weight-bold)' }}>{formatCurrency(totalPaidAmount)}</strong>{' '}
            <span style={{ color: 'var(--color-text-tertiary)' }}>/ {formatCurrency(totalMonthlyCommitment)}</span>
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 'var(--weight-bold)',
            color: progressPct === 100 ? 'var(--color-income)' : 'var(--color-text-primary)',
            background: 'var(--color-surface)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
          }}>
            {progressPct}% {lang === 'bn' ? 'সম্পন্ন' : 'Complete'}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: 8,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface)',
          border: '1px solid var(--glass-border-subtle)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            background: progressPct === 100
              ? 'linear-gradient(90deg, #10B981 0%, #05DF72 100%)'
              : 'linear-gradient(90deg, #5ED21C 0%, #22C55E 100%)',
            transition: 'width 0.4s ease',
            borderRadius: 'var(--radius-full)',
          }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'all', label: lang === 'bn' ? `সকল (${totalCount})` : `All (${totalCount})` },
          { id: 'unpaid', label: lang === 'bn' ? `বাকি (${totalCount - paidCount})` : `Unpaid (${totalCount - paidCount})` },
          { id: 'paid', label: lang === 'bn' ? `পরিশোধিত (${paidCount})` : `Paid (${paidCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: filter === tab.id ? 'var(--weight-bold)' : 'var(--weight-medium)',
              background: filter === tab.id ? 'var(--color-primary)' : 'var(--glass-bg-subtle)',
              color: filter === tab.id ? '#111411' : 'var(--color-text-secondary)',
              border: `1px solid ${filter === tab.id ? 'var(--color-primary)' : 'var(--glass-border)'}`,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bills Cards Grid */}
      {filteredBills.length === 0 ? (
        <div style={{
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--glass-bg-subtle)',
          border: '1px dashed var(--glass-border)',
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: 'var(--text-sm)',
        }}>
          {lang === 'bn' ? 'কোনো নিয়মিত বিল পাওয়া যায়নি' : 'No recurring bills in this tab'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {filteredBills.map((bill) => {
            const acc = accounts.find((a) => a.id === bill.accountId);
            const isPaid = bill.isPaid;

            // Status message & styling
            let statusBadge = null;
            if (isPaid) {
              statusBadge = (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 'var(--weight-semibold)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--color-income)',
                }}>
                  <CheckCircle2 size={12} />
                  {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                </span>
              );
            } else if (bill.status === 'today') {
              statusBadge = (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 'var(--weight-bold)',
                  background: 'rgba(234, 179, 8, 0.18)',
                  color: '#D97706',
                }}>
                  <Clock size={12} />
                  {lang === 'bn' ? 'আজ পরিশোধের দিন' : 'Due Today'}
                </span>
              );
            } else if (bill.status === 'overdue') {
              statusBadge = (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 'var(--weight-semibold)',
                  background: 'rgba(244, 63, 94, 0.14)',
                  color: 'var(--color-expense)',
                }}>
                  <AlertCircle size={12} />
                  {lang === 'bn' ? `${Math.abs(bill.diffDays)} দিন পেরিয়েছে` : `Overdue by ${Math.abs(bill.diffDays)}d`}
                </span>
              );
            } else if (bill.status === 'dueSoon') {
              statusBadge = (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 'var(--weight-semibold)',
                  background: 'rgba(245, 158, 11, 0.14)',
                  color: '#D97706',
                }}>
                  <Clock size={12} />
                  {lang === 'bn' ? `${bill.diffDays} দিন বাকি` : `Due in ${bill.diffDays}d`}
                </span>
              );
            } else {
              statusBadge = (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  background: 'var(--glass-bg-subtle)',
                }}>
                  <Clock size={12} />
                  {lang === 'bn' ? `প্রতি মাসের ${bill.dueDay} তারিখ` : `Due on ${bill.dueDay}th`}
                </span>
              );
            }

            return (
              <div
                key={bill.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--color-surface)',
                  border: isPaid
                    ? '1px solid rgba(16, 185, 129, 0.25)'
                    : bill.status === 'overdue'
                    ? '1px solid rgba(244, 63, 94, 0.35)'
                    : '1px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Top Row: Icon, Title & Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-surface-secondary)',
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {bill.icon || '💳'}
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                        {bill.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>{t(`categories.expense.${bill.categoryId}`) || bill.categoryId}</span>
                        {acc && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{acc.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit / Delete Icons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => openEditBillModal(bill)}
                      title="Edit"
                      style={{ padding: 4, width: 28, height: 28 }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => setDeleteConfirmId(bill.id)}
                      title="Delete"
                      style={{ padding: 4, width: 28, height: 28, color: 'var(--color-expense)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Amount & Due Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-black)', color: 'var(--color-text-primary)' }}>
                      {formatCurrency(bill.amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      {lang === 'bn' ? `প্রতি মাসের ${bill.dueDay} তারিখ` : `Due day: ${bill.dueDay}th`}
                    </div>
                  </div>

                  <div>
                    {statusBadge}
                  </div>
                </div>

                {/* Bottom Row: CTA Button (Full Width & Center Aligned) */}
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--glass-border-subtle)', width: '100%' }}>
                  {isPaid ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleToggleUnpaid(bill.id)}
                      style={{ width: '100%', height: 36, justifyContent: 'center', fontSize: '12px', borderRadius: 'var(--radius-lg)' }}
                    >
                      <span>{lang === 'bn' ? 'অপরিশোধিত হিসেবে চিহ্নিত করুন' : 'Mark as Unpaid'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-lime btn-sm"
                      onClick={() => openPayModal(bill)}
                      style={{ width: '100%', height: 38, justifyContent: 'center', fontSize: '13px', fontWeight: 'var(--weight-bold)', gap: 6, borderRadius: 'var(--radius-lg)' }}
                    >
                      <Check size={15} strokeWidth={2.5} />
                      <span>{lang === 'bn' ? 'পরিশোধ করুন' : 'Pay / Mark Paid'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          ADD / EDIT RECURRING BILL MODAL
          ======================================================== */}
      <Modal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title={editingBill ? (lang === 'bn' ? 'নিয়মিত ব্যয় সম্পাদনা' : 'Edit Recurring Expense') : (lang === 'bn' ? 'নতুন নিয়মিত ব্যয় যুক্ত করুন' : 'Add Recurring Expense')}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setBillModalOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-lime"
              onClick={handleSaveBill}
              disabled={!formName.trim() || !formAmount}
            >
              {t('common.save')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveBill} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Bill Name */}
          <div className="form-group">
            <label className="form-label">{lang === 'bn' ? 'বিল বা ব্যয়ের নাম' : 'Bill / Expense Name'} *</label>
            <input
              type="text"
              className="form-input"
              placeholder={lang === 'bn' ? 'যেমন: বাসা ভাড়া, ওয়াইফাই' : 'e.g. Home Rent, Fiber Internet'}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          {/* Amount & Due Day */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">{lang === 'bn' ? 'পরিমাণ (BDT ৳)' : 'Monthly Amount (৳)'} *</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'bn' ? 'পরিশোধের তারিখ (১-৩১)' : 'Due Day (1–31)'} *</label>
              <input
                type="number"
                min="1"
                max="31"
                className="form-input"
                placeholder="5"
                value={formDueDay}
                onChange={(e) => setFormDueDay(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</label>
            <select
              className="form-input form-select"
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
            >
              {(categories.expense || []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.custom ? cat.label : t(`categories.expense.${cat.key}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Default Account Source */}
          <div className="form-group">
            <label className="form-label">{lang === 'bn' ? 'পরিশোধের উৎস অ্যাকাউন্ট' : 'Payment Account Source'}</label>
            <select
              className="form-input form-select"
              value={formAccountId}
              onChange={(e) => setFormAccountId(e.target.value)}
            >
              <option value="">{lang === 'bn' ? '-- অ্যাকাউন্ট বাছাই করুন --' : '-- Select Account --'}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type ? acc.type.toUpperCase() : 'WALLET'}) — ৳{(Number(acc.balance) || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Icon Selector */}
          <div className="form-group">
            <label className="form-label">{lang === 'bn' ? 'আইকন বেছে নিন' : 'Choose Icon Emoji'}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormIcon(emoji)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: formIcon === emoji ? '2px solid var(--color-primary)' : '1px solid var(--glass-border)',
                    background: formIcon === emoji ? 'var(--color-primary-glow)' : 'var(--glass-bg-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          PAY RECURRING BILL MODAL
          ======================================================== */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => { setPayModalOpen(false); setPayingBill(null); }}
        title={lang === 'bn' ? 'বিল পরিশোধ নিশ্চিতকরণ' : 'Confirm Bill Payment'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setPayModalOpen(false); setPayingBill(null); }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-lime"
              onClick={handleConfirmPayment}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{lang === 'bn' ? 'পরিশোধ নিশ্চিত করুন' : 'Confirm Payment'}</span>
            </button>
          </>
        }
      >
        {payingBill && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Bill Summary Card */}
            <div style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--glass-bg-subtle)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '24px' }}>{payingBill.icon || '💳'}</span>
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>
                    {payingBill.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    {monthName}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-black)', color: 'var(--color-expense)' }}>
                {formatCurrency(Number(payAmount) || payingBill.amount)}
              </div>
            </div>

            {/* Quick check for just marking paid without transaction */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={payWithoutTxn}
                onChange={(e) => setPayWithoutTxn(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
              />
              <span>{lang === 'bn' ? 'ব্যালেন্স না কেটে কেবল পরিশোধিত হিসেবে চিহ্নিত করুন' : 'Just mark as paid without creating an expense transaction'}</span>
            </label>

            {!payWithoutTxn && (
              <>
                {/* Account Source */}
                <div className="form-group">
                  <label className="form-label">{lang === 'bn' ? 'উৎস অ্যাকাউন্ট (টাকা কাটা হবে)' : 'Pay From Account (Debit)'} *</label>
                  <select
                    className="form-input form-select"
                    value={payAccountId}
                    onChange={(e) => setPayAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type ? acc.type.toUpperCase() : 'WALLET'}) — ৳{(Number(acc.balance) || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">{lang === 'bn' ? 'পরিমাণ (BDT ৳)' : 'Amount (৳)'}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{lang === 'bn' ? 'তারিখ' : 'Date'}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ========================================================
          DELETE CONFIRMATION MODAL
          ======================================================== */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title={lang === 'bn' ? 'মুছে ফেলার নিশ্চিতকরণ' : 'Delete Recurring Expense'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteConfirmId(null)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-expense"
              onClick={() => {
                deleteRecurringBill(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              {t('common.delete')}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {lang === 'bn'
            ? 'আপনি কি নিশ্চিত যে এই নিয়মিত বিলটি তালিকা থেকে মুছে ফেলতে চান?'
            : 'Are you sure you want to remove this recurring expense from your monthly list?'}
        </p>
      </Modal>
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
      {content}
    </div>
  );
}
