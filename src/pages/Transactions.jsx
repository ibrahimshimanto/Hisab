import { useState, useMemo, useRef } from 'react';
import {
  Plus, ArrowUpRight, ArrowDownRight, Search,
  Upload, Download, Edit2, Trash2, Filter, X,
} from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import useStore from '../store/useStore.js';
import Modal from '../components/ui/Modal.jsx';

export default function Transactions() {
  const { t, formatCurrency, formatDate, lang } = useTranslation();
  const {
    accounts, transactions, categories,
    addTransaction, updateTransaction, deleteTransaction,
    addCustomCategory, importTransactions,
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  // Form state
  const [formType, setFormType] = useState('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formAccountId, setFormAccountId] = useState(() => (accounts && accounts.length > 0 ? accounts[0].id : ''));
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formRecurring, setFormRecurring] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const fileInputRef = useRef();

  const resetForm = () => {
    setFormType('expense');
    setFormAmount('');
    setFormCategoryId('');
    setFormCustomCategory('');
    setFormAccountId(accounts.length > 0 ? accounts[0].id : '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormRecurring(false);
    setShowCustomCategory(false);
    setEditingTxn(null);
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (txn) => {
    setEditingTxn(txn);
    setFormType(txn.type);
    setFormAmount(String(txn.amount));
    setFormCategoryId(txn.categoryId);
    setFormAccountId(txn.accountId);
    setFormDate(txn.date);
    setFormDescription(txn.description || '');
    setFormRecurring(txn.recurring || false);
    setShowCustomCategory(false);
    setShowAddModal(true);
  };

  const handleSave = () => {
    const amount = parseFloat(formAmount);
    if (!amount || !formAccountId) return;

    let categoryId = formCategoryId;
    if (showCustomCategory && formCustomCategory.trim()) {
      addCustomCategory(formType, formCustomCategory.trim());
      categoryId = formCustomCategory.trim().toLowerCase().replace(/\s+/g, '-');
    }

    if (!categoryId) return;

    const data = {
      type: formType,
      amount,
      categoryId,
      accountId: formAccountId,
      date: formDate,
      description: formDescription.trim(),
      recurring: formRecurring,
    };

    if (editingTxn) {
      updateTransaction(editingTxn.id, data);
    } else {
      addTransaction(data);
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (id) => {
    deleteTransaction(id);
    setDeleteConfirm(null);
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const txns = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });

        const amount = parseFloat(row.amount);
        if (isNaN(amount)) continue;

        txns.push({
          type: (row.type || '').toLowerCase() === 'income' ? 'income' : 'expense',
          amount: Math.abs(amount),
          categoryId: (row.category || 'other').toLowerCase().replace(/\s+/g, '-'),
          accountId: accounts.length > 0 ? accounts[0].id : '',
          date: row.date || new Date().toISOString().split('T')[0],
          description: row.description || row.note || '',
          recurring: false,
        });
      }

      if (txns.length > 0) {
        importTransactions(txns);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCSVExport = () => {
    const headers = ['Date,Type,Category,Amount,Description,Account'];
    const rows = transactions.map((txn) => {
      const cat = getCategoryLabel(txn.categoryId, txn.type);
      const acc = accounts.find((a) => a.id === txn.accountId);
      return `${txn.date},${txn.type},${cat},${txn.amount},${txn.description || ''},${acc?.name || ''}`;
    });
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisab-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryInfo = (categoryId, type) => {
    const allCats = categories[type] || [];
    return allCats.find((c) => c.id === categoryId);
  };

  const getCategoryLabel = (categoryId, type) => {
    const cat = getCategoryInfo(categoryId, type);
    if (!cat) return categoryId;
    if (cat.custom) return cat.label;
    return t(`categories.${type}.${cat.key}`);
  };

  const currentCategories = categories[formType] || [];

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter((t) => t.categoryId === filterCategory);
    }
    if (filterSource !== 'all') {
      filtered = filtered.filter((t) => t.accountId === filterSource);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.description || '').toLowerCase().includes(q) ||
        getCategoryLabel(t.categoryId, t.type).toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterType, filterCategory, filterSource, searchQuery]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">{t('transactions.title')}</h1>
          <p className="page-subtitle">{t('transactions.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title={t('transactions.importCSV')}
          >
            <Upload size={15} />
            <span className="btn-text-full">{t('transactions.importCSV')}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVImport} />
          <button
            type="button"
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={handleCSVExport}
            title={t('transactions.exportCSV')}
          >
            <Download size={15} />
            <span className="btn-text-full">{t('transactions.exportCSV')}</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm header-action-btn" onClick={openAdd}>
            <Plus size={16} strokeWidth={2.5} />
            <span className="btn-text-full">{t('transactions.addTransaction')}</span>
            <span className="btn-text-short">{lang === 'bn' ? 'যুক্ত' : 'Add'}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card transaction-filters-card" style={{ marginBottom: 'var(--space-4)', padding: '12px 14px' }}>
        <div className="transaction-filters-grid">
          <div className="transaction-search-wrap">
            <Search size={16} className="transaction-search-icon" />
            <input
              className="form-input transaction-search-input"
              type="text"
              placeholder={t('transactions.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="transaction-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="transaction-selects-row">
            <div className="transaction-select-wrap">
              <select className="form-input form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">{t('transactions.all')}</option>
                <option value="income">{t('transactions.income')}</option>
                <option value="expense">{t('transactions.expense')}</option>
              </select>
            </div>
            <div className="transaction-select-wrap">
              <select className="form-input form-select" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                <option value="all">{t('transactions.filterBySource')}</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        {filteredTransactions.length > 0 ? (
          <div>
            {filteredTransactions.map((txn) => {
              const cat = getCategoryInfo(txn.categoryId, txn.type);
              const acc = accounts.find((a) => a.id === txn.accountId);
              return (
                <div key={txn.id} className="transaction-row" style={{ cursor: 'pointer' }}>
                  <div className="transaction-icon" style={{
                    background: cat?.color ? `${cat.color}20` : 'var(--color-surface-secondary)',
                    color: cat?.color || 'var(--color-text-secondary)',
                  }}>
                    {txn.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-name">
                      {txn.description || getCategoryLabel(txn.categoryId, txn.type)}
                    </div>
                    <div className="transaction-meta">
                      <span>{getCategoryLabel(txn.categoryId, txn.type)}</span>
                      <span>·</span>
                      <span>{acc?.name || ''}</span>
                      <span>·</span>
                      <span>{formatDate(txn.date)}</span>
                      {txn.recurring && <span className="badge badge-income" style={{ fontSize: 9 }}>↻</span>}
                    </div>
                  </div>
                  <div className={`transaction-amount ${txn.type}`}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(txn); }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(txn.id); }} style={{ color: 'var(--color-expense)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Filter size={28} /></div>
            <p className="empty-state-title">{t('transactions.noTransactions')}</p>
            <p className="empty-state-desc">{t('transactions.noTransactionsDesc')}</p>
            <button className="btn btn-primary btn-lg" onClick={openAdd}>
              <Plus size={18} />
              {t('transactions.addTransaction')}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={editingTxn ? t('transactions.editTransaction') : t('transactions.addTransaction')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {t('common.save')}
            </button>
          </>
        }
      >
        {/* Type Toggle */}
        <div className="form-group">
          <label className="form-label">{t('transactions.type')}</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className={`type-pill type-pill-income ${formType === 'income' ? 'active' : ''}`}
              onClick={() => { setFormType('income'); setFormCategoryId(''); }}
            >
              <ArrowDownRight size={16} />
              {t('transactions.income')}
            </button>
            <button
              className={`type-pill type-pill-expense ${formType === 'expense' ? 'active' : ''}`}
              onClick={() => { setFormType('expense'); setFormCategoryId(''); }}
            >
              <ArrowUpRight size={16} />
              {t('transactions.expense')}
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">{t('transactions.amount')}</label>
          <input
            className="form-input"
            type="number"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            placeholder={t('transactions.amountPlaceholder')}
            autoFocus
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">{t('transactions.category')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {currentCategories.map((cat) => (
              <button
                key={cat.id}
                className={`badge ${formCategoryId === cat.id ? '' : ''}`}
                style={{
                  background: formCategoryId === cat.id ? cat.color : `${cat.color}20`,
                  color: formCategoryId === cat.id ? 'white' : cat.color,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  border: formCategoryId === cat.id ? `2px solid ${cat.color}` : '2px solid transparent',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => { setFormCategoryId(cat.id); setShowCustomCategory(false); }}
              >
                {cat.custom ? cat.label : t(`categories.${formType}.${cat.key}`)}
              </button>
            ))}
            <button
              className="badge"
              style={{
                background: showCustomCategory ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                color: showCustomCategory ? '#111411' : 'var(--color-text-secondary)',
                fontWeight: showCustomCategory ? 'var(--weight-bold)' : 'var(--weight-medium)',
                cursor: 'pointer',
                padding: '6px 12px',
                border: '2px dashed var(--color-border)',
              }}
              onClick={() => setShowCustomCategory(!showCustomCategory)}
            >
              + {t('transactions.customCategory')}
            </button>
          </div>
          {showCustomCategory && (
            <input
              className="form-input"
              style={{ marginTop: 'var(--space-2)' }}
              type="text"
              value={formCustomCategory}
              onChange={(e) => setFormCustomCategory(e.target.value)}
              placeholder={t('transactions.customCategoryPlaceholder')}
            />
          )}
        </div>

        {/* Account Source */}
        <div className="form-group">
          <label className="form-label">{t('transactions.source')}</label>
          <select className="form-input form-select" value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)}>
            <option value="">{lang === 'bn' ? '-- অ্যাকাউন্ট বাছাই করুন --' : '-- Select Account --'}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">{t('transactions.date')}</label>
          <input className="form-input" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">{t('transactions.description')}</label>
          <input className="form-input" type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={t('transactions.descriptionPlaceholder')} />
        </div>

        {/* Recurring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input type="checkbox" id="recurring" checked={formRecurring} onChange={(e) => setFormRecurring(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
          <label htmlFor="recurring" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            {t('transactions.recurringMonthly')}
          </label>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('transactions.deleteTransaction')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>{t('common.delete')}</button>
          </>
        }
      >
        <p className="confirm-message">{t('transactions.deleteConfirm')}</p>
      </Modal>
    </div>
  );
}
