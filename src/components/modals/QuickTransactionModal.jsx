import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, ArrowDownLeft, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { useTranslation } from '../../i18n/index.jsx';
import useStore from '../../store/useStore.js';

export default function QuickTransactionModal() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { quickAddModal, closeQuickAdd, accounts, categories, addTransaction, addCustomCategory } = useStore();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(() => (accounts && accounts.length > 0 ? accounts[0].id : ''));
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customCatName, setCustomCatName] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);

  useEffect(() => {
    if (quickAddModal.isOpen) {
      setType(quickAddModal.type || 'expense');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsCustomCat(false);
      setCustomCatName('');
      if (accounts && accounts.length > 0) {
        setAccountId(accounts[0].id);
      }
    }
  }, [quickAddModal.isOpen, quickAddModal.type, accounts]);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      if (!accountId || !accounts.some((a) => a.id === accountId)) {
        setAccountId(accounts[0].id);
      }
    }
  }, [accounts, accountId]);

  useEffect(() => {
    const cats = categories[type] || [];
    if (cats.length > 0 && !isCustomCat) {
      setCategoryId(cats[0].id);
    }
  }, [type, categories]);

  if (!quickAddModal.isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !accountId) return;

    let finalCatId = categoryId;
    if (isCustomCat && customCatName.trim()) {
      addCustomCategory(type, customCatName.trim());
      finalCatId = customCatName.trim().toLowerCase().replace(/\s+/g, '-');
    }

    addTransaction({
      type,
      amount: parsedAmount,
      accountId,
      categoryId: finalCatId,
      description: description.trim(),
      date,
    });

    closeQuickAdd();
  };

  const currentCats = categories[type] || [];

  return (
    <Modal
      isOpen={quickAddModal.isOpen}
      onClose={closeQuickAdd}
      title={type === 'expense' ? (t('transactions.addExpense') || 'Add Expense') : (t('transactions.addIncome') || 'Add Income')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={closeQuickAdd}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!parseFloat(amount) || !accountId}
          >
            <Check size={18} />
            {t('common.save')}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Type Switcher Pills */}
        <div className="toggle-group">
          <div
            className={`toggle-option ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
            style={type === 'expense' ? { color: 'var(--color-expense)', borderColor: 'rgba(244,63,94,0.3)' } : {}}
          >
            <ArrowDownLeft size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            {t('transactions.expense')}
          </div>
          <div
            className={`toggle-option ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
            style={type === 'income' ? { color: 'var(--color-income)', borderColor: 'rgba(16,185,129,0.3)' } : {}}
          >
            <ArrowUpRight size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
            {t('transactions.income')}
          </div>
        </div>

        {/* Big Amount Input */}
        <div className="form-group">
          <label className="form-label">{t('transactions.amount')} (BDT ৳)</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-black)',
              color: type === 'income' ? 'var(--color-income)' : 'var(--color-expense)',
            }}>
              ৳
            </span>
            <input
              type="number"
              step="any"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                paddingLeft: 44,
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-black)',
                letterSpacing: '-0.02em',
                height: 56,
              }}
              required
            />
          </div>
        </div>

        {/* Source Account Selector */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ margin: 0 }}>{t('transactions.source')}</label>
            {accounts && accounts.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                {accounts.length} {lang === 'bn' ? 'উৎস উপলব্ধ' : 'sources'}
              </span>
            )}
          </div>

          {!accounts || accounts.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px dashed rgba(244, 63, 94, 0.3)',
              gap: 8,
            }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-expense)', fontWeight: 'var(--weight-semibold)' }}>
                {lang === 'bn' ? 'কোনো অ্যাকাউন্ট যুক্ত নেই' : 'No account sources found'}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  closeQuickAdd();
                  navigate('/accounts');
                }}
                style={{ padding: '4px 10px', fontSize: '11px', height: 28 }}
              >
                + {lang === 'bn' ? 'অ্যাকাউন্ট যোগ করুন' : 'Add Account'}
              </button>
            </div>
          ) : (
            <select
              className="form-input form-select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type ? a.type.toUpperCase() : 'WALLET'}) — ৳{(Number(a.balance) || 0).toLocaleString()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Category Pills & Custom Category */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">{t('transactions.category')}</label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsCustomCat(!isCustomCat)}
              style={{ color: 'var(--color-primary)', fontSize: 'var(--text-xs)' }}
            >
              <Sparkles size={14} />
              {isCustomCat ? t('common.select') : t('transactions.customCategory')}
            </button>
          </div>

          {isCustomCat ? (
            <input
              type="text"
              className="form-input"
              placeholder={t('transactions.customCategoryPlaceholder') || 'Enter category name...'}
              value={customCatName}
              onChange={(e) => setCustomCatName(e.target.value)}
              required
            />
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              maxHeight: 140,
              overflowY: 'auto',
              padding: '2px',
            }}>
              {currentCats.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className="btn btn-sm"
                  onClick={() => setCategoryId(cat.id)}
                  style={{
                    background: categoryId === cat.id ? cat.color : 'var(--glass-bg-subtle)',
                    color: categoryId === cat.id ? '#FFFFFF' : 'var(--color-text-primary)',
                    border: `1px solid ${categoryId === cat.id ? cat.color : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    boxShadow: categoryId === cat.id ? `0 4px 12px ${cat.color}55` : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: categoryId === cat.id ? '#FFFFFF' : cat.color,
                      marginRight: 4,
                    }}
                  />
                  {cat.custom ? cat.label : t(`categories.${type}.${cat.key}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date & Note Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label">{t('transactions.date')}</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('transactions.description')}</label>
            <input
              type="text"
              className="form-input"
              placeholder={t('transactions.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
